const strategyId = '01KZY1G56YFYWKS8AH0PR1YMQX';
const usdc = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed.' });
  try {
    const route = String(req.body?.route || req.query.route || '').replace(/^\//, '');
    const body = req.body || {};
    if (route === 'strategy') return res.json(await glider(`/strategies/${strategyId}`, undefined, 'GET'));
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
