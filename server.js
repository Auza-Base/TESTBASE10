const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const envPath = path.join(root, '.env');
const env = fs.existsSync(envPath) ? Object.fromEntries(fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter(Boolean).map(line => line.split('='))) : {};
const GLIDER_API_KEY = process.env.GLIDER_API_KEY || env.GLIDER_API_KEY;
const gliderBase = 'https://api.glider.fi/v1';
const baseAssets = [
  ['0xb20000000000000000000078ee7ce2fE4908108C', '18'], ['0xb200000000000000000000C2e324d24d7eEcd1fb', '15'],
  ['0xb2000000000000000000002D0BA3164cc74f58B7', '14'], ['0xb2000000000000000000008bC8786B856E61707C', '9'],
  ['0xb200000000000000000000d9192b6B456483C2E8', '11'], ['0xB200000000000000000000Ab99cFa739E253872B', '13'],
  ['0xb2000000000000000000004884b426556b92883d', '5'], ['0xb200000000000000000000397293Cb8cda9a10c5', '3'],
  ['0xb2000000000000000000007b9fcbd005511aCBd5', '5'], ['0xb2000000000000000000001e800a7f5189430cD0', '7']
];
const templateData = {
  name: 'Base Ten', description: 'Fixed Base tokenized-stock allocation',
  entry: { blockType: 'weight', weightType: 'specified-percentage', weightings: baseAssets.map(([, weight]) => weight), children: baseAssets.map(([address]) => ({ blockType: 'asset', assetId: `${address}:8453` })) },
  tradingSettings: { type: 'threshold', triggerPercentage: 5 }
};

function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
async function body(req) { let data = ''; for await (const chunk of req) data += chunk; return JSON.parse(data || '{}'); }
async function glider(pathname, payload) {
  if (!GLIDER_API_KEY || GLIDER_API_KEY === 'replace_with_your_glider_key') throw new Error('GLIDER_API_KEY is not configured on this server.');
  const response = await fetch(`${gliderBase}${pathname}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-KEY': GLIDER_API_KEY }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok || data.success === false) throw new Error(data?.error?.message || `Glider request failed (${response.status})`);
  return data;
}

http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/glider/signature') {
      const { userAddress } = await body(req); return json(res, 200, await glider('/portfolio/create/signature', { userAddress, chainIds: [8453], accountIndex: '0' }));
    }
    if (req.method === 'POST' && req.url === '/api/glider/create') {
      const payload = await body(req); payload.templateData = templateData; return json(res, 200, await glider('/portfolio/create', payload));
    }
    if (req.method === 'POST' && req.url === '/api/glider/deposit') {
      const { portfolioId, amount } = await body(req); if (!portfolioId || Number(amount) < 25) throw new Error('Minimum deposit is 25 USDC.');
      return json(res, 200, await glider(`/portfolio/${portfolioId}/deposit`, { token: { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amount: String(amount) } }));
    }
    if (req.method === 'POST' && req.url === '/api/glider/rebalance') {
      const { portfolioId } = await body(req); return json(res, 200, await glider(`/portfolio/${portfolioId}/trigger`, { skipScheduleValidation: true }));
    }
    const relative = req.url === '/' ? 'index.html' : decodeURIComponent(req.url).replace(/^\//, '');
    const file = path.resolve(root, relative); if (!file.startsWith(root)) return json(res, 403, { error: 'Forbidden' });
    fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200); res.end(error ? 'Not found' : data); });
  } catch (error) { json(res, 400, { success: false, error: error.message }); }
}).listen(4173, '127.0.0.1', () => console.log('Base Ten running at http://localhost:4173'));
