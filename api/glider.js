const strategyId = '01KZY1G56YFYWKS8AH0PR1YMQX';
const usdc = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
let leaderboardCache = { expiresAt: 0, value: null };

function units(value) {
  const normalized = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,6})?$/.test(normalized)) throw new Error('Enter a valid USDC amount with at most 6 decimal places.');
  const [whole, fraction = ''] = normalized.split('.');
  return (BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6))).toString();
}
async function glider(endpoint, payload, method = 'POST') {
  const key = process.env.GLIDER_API_KEY;
  if (!key) throw new Error('GLIDER_API_KEY is not configured in Vercel.');
  const response = await fetch(`https://api.glider.fi/v2${endpoint}`, {
    method, headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    ...(method === 'GET' ? {} : { body: JSON.stringify(payload) })
  });
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result?.error?.message || `Glider request failed (${response.status}).`);
  return result;
}
function address(value) { return /^0x[a-fA-F0-9]{40}$/.test(value || ''); }
function maskOwnerAccount(ownerAccountId) {
  const wallet = String(ownerAccountId || '').split(':').pop();
  return address(wallet) ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : 'Private wallet';
}

async function buildLeaderboard() {
  if (leaderboardCache.value && Date.now() < leaderboardCache.expiresAt) return leaderboardCache.value;
  const listed = await glider(`/portfolios?strategyId=${encodeURIComponent(strategyId)}&limit=200`, undefined, 'GET');
  const portfolios = listed.data?.portfolios || [];
  const rows = [];
  // Keep concurrency modest: each position call may read several chains.
  for (let start = 0; start < portfolios.length; start += 8) {
    const batch = portfolios.slice(start, start + 8);
    const result = await Promise.all(batch.map(async portfolio => {
      try {
        const positions = await glider(`/portfolios/${encodeURIComponent(portfolio.portfolioId)}/positions`, undefined, 'GET');
        return { wallet: maskOwnerAccount(portfolio.ownerAccountId), valueUsd: Number(positions.data?.totalValueUsd || 0), status: portfolio.schedule?.status || 'not scheduled' };
      } catch {
        return { wallet: maskOwnerAccount(portfolio.ownerAccountId), valueUsd: 0, status: portfolio.schedule?.status || 'not scheduled' };
      }
    }));
    rows.push(...result);
  }
  const byWallet = new Map();
  rows.forEach(row => {
    const current = byWallet.get(row.wallet) || { wallet: row.wallet, valueUsd: 0, portfolioCount: 0, status: 'not scheduled' };
    current.valueUsd += row.valueUsd;
    current.portfolioCount += 1;
    if (row.status === 'active') current.status = 'active';
    byWallet.set(row.wallet, current);
  });
  const rankedWallets = [...byWallet.values()].sort((a, b) => b.valueUsd - a.valueUsd);
  const value = {
    portfolioCount: portfolios.length,
    walletCount: rankedWallets.length,
    totalValueUsd: rankedWallets.reduce((sum, row) => sum + row.valueUsd, 0),
    rows: rankedWallets.slice(0, 25).map((row, index) => ({ rank: index + 1, ...row })),
    updatedAt: new Date().toISOString()
  };
  leaderboardCache = { value, expiresAt: Date.now() + 60_000 };
  return value;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed.' });
  try {
    const route = String(req.body?.route || req.query.route || '').replace(/^\//, '');
    const body = req.body || {};
    if (route === 'strategy') return res.json(await glider(`/strategies/${strategyId}`, undefined, 'GET'));
    if (route === 'leaderboard') return res.json({ success: true, data: await buildLeaderboard() });
    if (route === 'signature') {
      if (!address(body.userAddress)) throw new Error('Connect a standard EOA wallet address.');
      const request = { ownerAccountId: `eip155:0:${body.userAddress}`, strategyId, chainIds: [8453], accountType: 'ECDSA' };
      const result = await glider('/enroll/signature', request);
      return res.json({ success: true, data: { ...result.data, ...request } });
    }
    if (route === 'portfolio/resolve') {
      if (!address(body.userAddress)) throw new Error('Connect a standard EOA wallet address.');
      const owner = `eip155:0:${body.userAddress}`;
      const result = await glider(`/portfolios?ownerAccountId=${encodeURIComponent(owner)}&strategyId=${strategyId}&limit=2`, undefined, 'GET');
      return res.json({ success: true, data: { portfolioId: result.data?.portfolios?.[0]?.portfolioId || null } });
    }
    if (route === 'create') {
      const allowed = ['ownerAccountId', 'strategyId', 'chainIds', 'accountIndex', 'agentAccountId', 'signature', 'flowId', 'portfolioName'];
      const enrollment = Object.fromEntries(allowed.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
      if (enrollment.strategyId !== strategyId || !enrollment.ownerAccountId?.startsWith('eip155:0:')) throw new Error('Invalid enrollment request. Start again.');
      const listed = await glider(`/portfolios?ownerAccountId=${encodeURIComponent(enrollment.ownerAccountId)}&strategyId=${strategyId}&limit=2`, undefined, 'GET');
      const existing = listed.data?.portfolios?.[0];
      if (existing) return res.json({ success: true, data: { portfolioId: existing.portfolioId, reused: true } });
      return res.status(201).json(await glider('/enroll', enrollment));
    }
    if (route === 'deposit') {
      if (!body.portfolioId || Number(body.amount) < 1 || !address(body.userWalletAddress)) throw new Error('Minimum investment is 1 USDC and a connected wallet is required.');
      const portfolio = await glider(`/portfolios/${body.portfolioId}`, undefined, 'GET');
      const account = (portfolio.data?.smartAccounts || []).find(item => item.accountId?.startsWith('eip155:8453:'));
      const caip = account?.depositAccountId || account?.accountId;
      const matched = caip?.match(/^eip155:8453:(0x[a-fA-F0-9]{40})$/);
      if (!matched) throw new Error('Glider has not returned a Base deposit account yet. Wait a moment and retry.');
      return res.json({ success: true, data: { destination: matched[1], tokenAmount: units(body.amount), tokenContractAddress: usdc } });
    }
    if (route === 'positions') return res.json(await glider(`/portfolios/${body.portfolioId}/positions`, undefined, 'GET'));
    if (route === 'performance') return res.json(await glider(`/portfolios/${body.portfolioId}/performance`, undefined, 'GET'));
    if (route === 'rebalance') return res.json(await glider(`/portfolios/${body.portfolioId}/rebalance`, {}));
    if (route === 'withdraw/prepare') {
      if (!address(body.recipientAddress) || !body.assetId || !/^\d+$/.test(String(body.amountRaw || ''))) throw new Error('Choose a valid withdrawal asset and amount.');
      return res.json(await glider(`/portfolios/${body.portfolioId}/withdraw/signature`, { recipientAccountId: `eip155:8453:${body.recipientAddress}`, assets: [{ assetId: body.assetId, amountRaw: String(body.amountRaw) }] }));
    }
    if (route === 'withdraw/submit') return res.status(202).json(await glider(`/portfolios/${body.portfolioId}/withdraw`, { message: body.message, signature: body.signature }));
    throw new Error('Unknown Glider request.');
  } catch (error) { return res.status(400).json({ success: false, error: error.message || 'Request failed.' }); }
};
