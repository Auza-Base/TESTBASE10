const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const envPath = path.join(root, '.env');
const strategyId = '01KZY1G56YFYWKS8AH0PR1YMQX';

function apiKey() {
  if (process.env.GLIDER_API_KEY) return process.env.GLIDER_API_KEY;
  const line = fs.existsSync(envPath) && fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find(value => value.startsWith('GLIDER_API_KEY='));
  return line ? line.slice('GLIDER_API_KEY='.length).trim() : '';
}
function sendJson(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
async function readBody(req) { let text = ''; for await (const chunk of req) text += chunk; return JSON.parse(text || '{}'); }
async function gliderV2(endpoint, payload, method = 'POST') {
  const key = apiKey();
  if (!key) throw new Error('GLIDER_API_KEY is not configured.');
  const response = await fetch(`https://api.glider.fi/v2${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    ...(method === 'GET' ? {} : { body: JSON.stringify(payload) })
  });
  const result = await response.json();
  if (!response.ok || result.success === false) {
    const message = result?.error?.message || `Glider request failed (${response.status}).`;
    if (message.includes('Strategy not found or not owned by tenant')) throw new Error('This Glider API key is not authorized to distribute the Base Ten strategy. Ask the strategy owner to add your Glider tenant as a distributor with enroll:write access.');
    throw new Error(message);
  }
  return result;
}
async function gliderV1(endpoint, payload) {
  const key = apiKey();
  if (!key) throw new Error('GLIDER_API_KEY is not configured.');
  const response = await fetch(`https://api.glider.fi/v1${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-KEY': key }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result?.error?.message || `Glider request failed (${response.status}).`);
  return result;
}
function usdcBaseUnits(value) {
  const normalized = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,6})?$/.test(normalized)) throw new Error('Enter a valid USDC amount with at most 6 decimal places.');
  const [whole, fraction = ''] = normalized.split('.');
  return (BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6))).toString();
}

const port = Number(process.env.PORT || 4191);
http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/glider/signature') {
      const { userAddress } = await readBody(req);
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress || '')) throw new Error('Connect a standard EOA wallet address.');
      const request = { ownerAccountId: `eip155:0:${userAddress}`, strategyId, chainIds: [8453], accountType: 'ECDSA' };
      const result = await gliderV2('/enroll/signature', request);
      return sendJson(res, 200, { success: true, data: { ...result.data, ...request } });
    }
    if (req.method === 'POST' && req.url === '/api/glider/strategy') {
      return sendJson(res, 200, await gliderV2(`/strategies/${strategyId}`, undefined, 'GET'));
    }
    if (req.method === 'POST' && req.url === '/api/glider/portfolio/resolve') {
      const { userAddress } = await readBody(req);
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress || '')) throw new Error('Connect a standard EOA wallet address.');
      const ownerAccountId = `eip155:0:${userAddress}`;
      const result = await gliderV2(`/portfolios?ownerAccountId=${encodeURIComponent(ownerAccountId)}&strategyId=${strategyId}&limit=2`, undefined, 'GET');
      const existing = result.data?.portfolios?.[0];
      return sendJson(res, 200, { success: true, data: { portfolioId: existing?.portfolioId || null } });
    }
    if (req.method === 'POST' && req.url === '/api/glider/create') {
      const payload = await readBody(req);
      const allowed = ['ownerAccountId', 'strategyId', 'chainIds', 'accountIndex', 'agentAccountId', 'signature', 'flowId', 'portfolioName'];
      const enrollment = Object.fromEntries(allowed.filter(key => payload[key] !== undefined).map(key => [key, payload[key]]));
      if (enrollment.strategyId !== strategyId || enrollment.ownerAccountId?.startsWith('eip155:0:') !== true) throw new Error('Invalid enrollment request. Start vault creation again.');
      const portfolios = await gliderV2(`/portfolios?ownerAccountId=${encodeURIComponent(enrollment.ownerAccountId)}&strategyId=${strategyId}&limit=2`, undefined, 'GET');
      const existing = portfolios.data?.portfolios?.[0];
      if (existing) return sendJson(res, 200, { success: true, data: { portfolioId: existing.portfolioId, reused: true } });
      return sendJson(res, 201, await gliderV2('/enroll', enrollment));
    }
    if (req.method === 'POST' && req.url === '/api/glider/deposit') {
      const { portfolioId, amount, userWalletAddress } = await readBody(req);
      if (!portfolioId || Number(amount) < 1) throw new Error('Minimum investment is 1 USDC.');
      if (!/^0x[a-fA-F0-9]{40}$/.test(userWalletAddress || '')) throw new Error('Connect the wallet that owns this portfolio.');
      // Current Glider B2B funding is a direct ERC-20 transfer to the portfolio's
      // Base smart account. The legacy /v1/portfolio/:id/deposit simulation is not
      // compatible with portfolios enrolled through /v2/enroll.
      const portfolio = await gliderV2(`/portfolios/${portfolioId}`, undefined, 'GET');
      const accounts = portfolio.data?.smartAccounts || portfolio.data?.smart_accounts || [];
      const baseAccount = accounts.find(account => String(account.accountId || account.account_id || '').startsWith('eip155:8453:'));
      const caipAccount = baseAccount?.depositAccountId || baseAccount?.deposit_account_id || baseAccount?.accountId || baseAccount?.account_id;
      const match = typeof caipAccount === 'string' && caipAccount.match(/^eip155:8453:(0x[a-fA-F0-9]{40})$/);
      if (!match) throw new Error('Glider has not returned a Base deposit account for this portfolio yet. Wait a moment, then try again.');
      return sendJson(res, 200, { success: true, data: {
        destination: match[1],
        tokenAmount: usdcBaseUnits(amount),
        tokenContractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      }});
    }
    if (req.method === 'POST' && req.url === '/api/glider/rebalance') {
      const { portfolioId } = await readBody(req);
      if (!portfolioId) throw new Error('No investment account found.');
      return sendJson(res, 200, await gliderV2(`/portfolios/${portfolioId}/rebalance`, {}));
    }
    if (req.method === 'POST' && req.url === '/api/glider/positions') {
      const { portfolioId } = await readBody(req);
      if (!portfolioId) throw new Error('No investment account found.');
      return sendJson(res, 200, await gliderV2(`/portfolios/${portfolioId}/positions`, undefined, 'GET'));
    }
    if (req.method === 'POST' && req.url === '/api/glider/withdraw/prepare') {
      const { portfolioId, recipientAddress, assetId, amountRaw } = await readBody(req);
      if (!portfolioId || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress || '')) throw new Error('Connect the recipient Base wallet before withdrawing.');
      if (typeof assetId !== 'string' || !/^\d+$/.test(String(amountRaw || '')) || BigInt(amountRaw) <= 0n) throw new Error('Choose a valid asset and withdrawal amount.');
      const positions = await gliderV2(`/portfolios/${portfolioId}/positions`, undefined, 'GET');
      const heldAsset = positions.data?.assets?.find(asset => asset.assetId === assetId);
      if (!heldAsset || BigInt(amountRaw) > BigInt(heldAsset.balanceRaw || '0')) throw new Error('The requested amount exceeds your indexed portfolio balance. Wait for indexing if you just deposited.');
      return sendJson(res, 200, await gliderV2(`/portfolios/${portfolioId}/withdraw/signature`, {
        recipientAccountId: `eip155:8453:${recipientAddress}`,
        assets: [{ assetId, amountRaw: String(amountRaw) }]
      }));
    }
    if (req.method === 'POST' && req.url === '/api/glider/withdraw/submit') {
      const { portfolioId, message, signature } = await readBody(req);
      if (!portfolioId || !message || typeof signature !== 'string') throw new Error('Withdrawal authorization is incomplete. Start the withdrawal again.');
      return sendJson(res, 202, await gliderV2(`/portfolios/${portfolioId}/withdraw`, { message, signature }));
    }
    const relative = req.url === '/' ? 'index.html' : decodeURIComponent(req.url).replace(/^\//, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root)) return sendJson(res, 403, { error: 'Forbidden' });
    fs.readFile(file, (error, contents) => { res.writeHead(error ? 404 : 200); res.end(error ? 'Not found' : contents); });
  } catch (error) { sendJson(res, 400, { success: false, error: error.message }); }
}).listen(port, '127.0.0.1', () => console.log(`Base Ten Glider app running at http://localhost:${port}`));
