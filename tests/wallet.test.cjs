const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { value: '', textContent: '', innerHTML: '', disabled: false, open: false,
      handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, setAttribute() {}, dispatchEvent() {}, showModal() { this.open = true; }, close() { this.open = false; } });
    return nodes.get(selector);
  };
  const context = vm.createContext({
    document: { querySelector: node, querySelectorAll: () => [node('.wallet-button')] },
    window: { addEventListener() {}, location: { hostname: 'localhost' }, BASE_TEN_CONFIG: {} },
    localStorage: { getItem: () => null, setItem() {} },
    fetch: () => new Promise(() => {}), Event: class {}, setTimeout() {}, console,
    URL, Blob
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'), context);
  const run = code => vm.runInContext(code, context);
  return { context, node, run };
}
const owner = '0x1111111111111111111111111111111111111111';
function session(failure) {
  return { address: owner, wallet: { switchChain: async () => { if (failure) throw failure; } },
    provider: { request: async ({ method }) => method === 'eth_chainId' ? '0x2105' : [owner], on() {}, removeListener() {} } };
}

test('disconnected action opens Privy but does not continue to a transaction', async () => {
  const { context, run } = setup();
  let opened = 0;
  context.window.BaseStockWallet = { ready: true, getSession: () => null, open: () => opened++ };
  assert.equal(await run('connectWallet(false)'), false);
  assert.equal(opened, 1);
});

test('early wallet click waits quietly for Privy instead of showing a popup', () => {
  const { node, run } = setup();
  run('openWalletDialog()');
  assert.equal(node('.wallet-button').textContent, 'Opening wallet…');
  assert.equal(node('#app-notice').open, false);
});

test('cancelled Base network switch aborts even with an existing connection', async () => {
  const { context, node, run } = setup();
  context.session = session({ code: 4001 });
  context.window.BaseStockWallet = { getSession: () => context.session };
  run('setWalletSession(session)');
  assert.equal(await run('connectWallet(false)'), false);
  assert.match(node('#app-notice-message').textContent, /cancelled/);
});

test('valid Privy session uses Base and preserves a typed withdrawal amount', async () => {
  const { context, node, run } = setup();
  context.session = session();
  context.window.BaseStockWallet = { getSession: () => context.session };
  run('setWalletSession(session)');
  node('#withdraw-amount').value = '1';
  assert.equal(await run('connectWallet(false)'), true);
  assert.equal(node('#withdraw-amount').value, '1');
});

test('disconnect clears amounts, balances, portfolio and disables withdrawals', () => {
  const { context, node, run } = setup();
  context.session = session();
  run('setWalletSession(session)');
  run("portfolioId = 'old'; withdrawAssets = [{symbol: 'USDC'}]");
  node('#withdraw-amount').value = '100';
  run('setWalletSession(null)');
  assert.equal(run('portfolioId'), undefined);
  assert.equal(run('withdrawAssets.length'), 0);
  assert.equal(node('#withdraw-amount').value, '');
  assert.equal(node('#withdraw-submit').disabled, true);
});

test('old portfolio response cannot overwrite state after a wallet disconnect', async () => {
  const { context, run } = setup();
  let resolve;
  context.fetch = () => new Promise(done => { resolve = done; });
  context.session = session();
  run('setWalletSession(session)');
  run('setWalletSession(null)');
  resolve({ ok: true, json: async () => ({data: {portfolioId: 'wrong-wallet-portfolio'}}) });
  await new Promise(done => setImmediate(done));
  assert.equal(run('portfolioId'), undefined);
});

test('signing rejects a different selected provider before accessing a signer', async () => {
  const { context, run } = setup();
  context.session = session();
  run('setWalletSession(session)');
  await assert.rejects(run('getVerifiedSigner(session.address, {})'), /wallet changed/);
});

test('cancelled withdrawal review never signs or submits', async () => {
  const {context,node,run}=setup();
  context.session=session();
  context.window.BaseStockWallet={getSession:()=>context.session};
  context.window.BaseStockSafetyCore=require('../public/safety-core.js');
  context.window.BaseStockSafety={review:async()=>false,status() {}};
  context.ethers=context.window.ethers={parseUnits:()=>1000000n};
  run("connectedAddress=session.address; activeProvider=session.provider; portfolioId='p1'; withdrawAssets=[{assetId:'USDC',symbol:'USDC',decimals:6,balanceRaw:'2000000'}]");
  node('#withdraw-asset').value='USDC';node('#withdraw-amount').value='1';
  const routes=[];
  context.fetch=async url=>{routes.push(url);return {ok:true,json:async()=>({data:{typedData:{domain:{chainId:8453},types:{},message:{portfolioId:'p1',recipientAccountId:`eip155:8453:${owner}`,assets:[{assetId:'USDC',amountRaw:'1000000'}]}}}})}};
  await node('#withdraw-submit').handlers.click();
  assert.equal(routes.length,1);
  assert.match(routes[0],/withdraw\/prepare/);
  assert.equal(run('walletActionBusy'),false);
  assert.equal(node('#withdraw-amount').value,'1');
});

test('rebalance review cancellation never dispatches execution', async () => {
  const {context,node,run}=setup();
  context.session=session();
  context.window.BaseStockWallet={getSession:()=>context.session};
  context.window.BaseStockSafety={review:async()=>false,render() {},renderEligibility() {}};
  run("connectedAddress=session.address; activeProvider=session.provider; portfolioId='p1'");
  // The connection refresh is read-only; no rebalance endpoint may be called.
  context.localStorage.getItem=()=> 'p1';
  const routes=[];
  context.fetch=async url=>{routes.push(url);return {ok:true,json:async()=>({data:{assets:[]}})}};
  await node('#rebalance-all').handlers.click();
  assert.equal(routes.some(url=>url.endsWith('/rebalance')),false);
  assert.equal(run('walletActionBusy'),false);
});

test('deposit review cancellation prevents transfer and restores action button', async () => {
  const {context,node,run}=setup();
  context.session=session();
  context.window.BaseStockWallet={getSession:()=>context.session};
  context.window.BaseStockSafety={review:async()=>false,render() {},renderEligibility() {}};
  run("connectedAddress=session.address; activeProvider=session.provider; portfolioId='p1'");
  context.localStorage.getItem=()=> 'p1';
  node('#amount').value='25';
  let transfers=0;
  const signer={provider:{getFeeData:async()=>({gasPrice:1n})}};
  function Contract() {this.balanceOf=async()=>100000000n;this.transfer=async()=>{transfers++;};this.transfer.estimateGas=async()=>21000n;}
  context.ethers=context.window.ethers={BrowserProvider:class {async getSigner(){return signer;}},Contract,isAddress:()=>true,parseUnits:()=>25000000n,formatEther:()=> '0.00001'};
  context.fetch=async url=>({ok:true,json:async()=>({data:url.endsWith('/deposit') ? {destination:'0x'+'2'.repeat(40),tokenAmount:'25000000',tokenContractAddress:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'} : {assets:[]}})});
  await node('#invest-usdc').handlers.click();
  assert.equal(transfers,0);
  assert.equal(run('walletActionBusy'),false);
  assert.equal(node('#invest-usdc').disabled,false);
});

test('wallet change while reviewing withdrawal prevents signing', async () => {
  const {context,node,run}=setup();context.session=session();
  context.window.BaseStockWallet={getSession:()=>context.session};
  context.window.BaseStockSafetyCore=require('../public/safety-core.js');
  context.window.BaseStockSafety={review:async()=>{run('connectedAddress=undefined');return true;},status(){}};
  context.ethers=context.window.ethers={parseUnits:()=>1000000n};
  run("connectedAddress=session.address; activeProvider=session.provider; portfolioId='p1'; withdrawAssets=[{assetId:'USDC',symbol:'USDC',decimals:6,balanceRaw:'2000000'}]");
  node('#withdraw-asset').value='USDC';node('#withdraw-amount').value='1';
  let calls=0;
  context.fetch=async()=>{calls++;return {ok:true,json:async()=>({data:{typedData:{domain:{chainId:8453},types:{},message:{portfolioId:'p1',recipientAccountId:`eip155:8453:${owner}`,assets:[{assetId:'USDC',amountRaw:'1000000'}]}}}})}};
  await node('#withdraw-submit').handlers.click();
  assert.equal(calls,1);
  assert.match(node('#app-notice-message').textContent,/wallet changed/);
});
