const portfolio = [
  ['NVDAc', 18, 'NVIDIA'], ['AAPLc', 15, 'Apple'], ['GOOGLc', 14, 'Alphabet'],
  ['METAc', 9, 'Meta'], ['AMZNc', 11, 'Amazon'], ['MSFTc', 13, 'Microsoft'],
  ['MSTRc', 5, 'Strategy'], ['SNDKc', 3, 'SanDisk'], ['SPCXc', 5, 'SpaceX'], ['TSLAc', 7, 'Tesla']
];
const grid = document.querySelector('#allocation-grid');
grid.innerHTML = portfolio.map(([ticker, weight, name]) => `<article class="asset"><div class="asset-weight">${weight}%</div><div class="asset-ticker">${ticker}</div><div class="asset-name">${name}</div><div class="asset-bar" style="width:${weight * 5.55}%"></div></article>`).join('');
const assetPicker = document.querySelector('#withdraw-asset');
let withdrawAssets = [];
assetPicker.addEventListener('change', () => {
  const asset = withdrawAssets.find(item => item.assetId === assetPicker.value);
  document.querySelector('#withdraw-symbol').textContent = asset?.symbol || 'USDC';
  document.querySelector('#withdraw-balance').textContent = asset ? `Available: ${asset.balance} ${asset.symbol}` : 'Select an indexed portfolio asset.';
});

let connectedAddress;
async function connectWallet() {
  if (!window.ethereum) { alert('Install a Base-compatible wallet such as Coinbase Wallet or MetaMask to continue.'); return; }
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
    const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    connectedAddress = address;
    document.querySelectorAll('.wallet-button').forEach(item => item.textContent = `${address.slice(0, 6)}…${address.slice(-4)}`);
    document.querySelector('.status').textContent = 'BASE CONNECTED';
    await loadWithdrawableAssets();
  } catch (error) { alert('Wallet connection was not completed.'); }
}
document.querySelectorAll('.wallet-button').forEach(button => button.addEventListener('click', connectWallet));

const apiBase = window.BASE_TEN_CONFIG?.apiBase || '/api';
const post = async (path, payload) => {
  const route = path.replace(/^\/glider\/?/, '');
  const response = await fetch(`${apiBase}/glider`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, route }) });
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.error?.message || result.error || 'Request failed');
  return result;
};
const knownAssets = Object.fromEntries(portfolio.map(([symbol, , name]) => [symbol.toLowerCase(), { symbol, name }]));
const knownAssetByAddress = {
  '0xb20000000000000000000078ee7ce2fe4908108c': knownAssets.nvdac,
  '0xb200000000000000000000c2e324d24d7eecd1fb': knownAssets.aaplc,
  '0xb2000000000000000000002d0ba3164cc74f58b7': knownAssets.googlc,
  '0xb2000000000000000000008bc8786b856e61707c': knownAssets.metac,
  '0xb200000000000000000000d9192b6b456483c2e8': knownAssets.amznc,
  '0xb200000000000000000000ab99cfa739e253872b': knownAssets.msftc,
  '0xb2000000000000000000004884b426556b92883d': knownAssets.mstrc,
  '0xb200000000000000000000397293cb8cda9a10c5': knownAssets.sndkc,
  '0xb2000000000000000000007b9fcbd005511acbd5': knownAssets.spcx,
  '0xb2000000000000000000001e800a7f5189430cd': knownAssets.tslac
};
async function loadLiveStrategy() {
  try {
    const strategy = (await post('/glider/strategy', {})).data;
    const assets = strategy.allocation?.assets || [];
    if (!assets.length) throw new Error('Strategy returned no allocation.');
    document.querySelector('#strategy-name').textContent = strategy.name || 'Selected Glider strategy';
    document.querySelector('#strategy-status').textContent = `Live allocation from Glider strategy ${strategy.strategyId}. Version ${strategy.version ?? 'current'}.`;
    grid.innerHTML = assets.map(asset => {
      const address = asset.assetId.split('erc20:')[1]?.toLowerCase();
      const known = knownAssetByAddress[address];
      const label = known?.symbol || asset.assetId.split('/').pop().slice(-12);
      const name = known?.name || asset.assetId;
      const weight = Number(asset.weight);
      return `<article class="asset"><div class="asset-weight">${weight}%</div><div class="asset-ticker">${label}</div><div class="asset-name">${name}</div><div class="asset-bar" style="width:${Math.max(0, Math.min(100, weight))}%"></div></article>`;
    }).join('');
  } catch (error) {
    document.querySelector('#strategy-name').textContent = 'Glider strategy allocation';
    document.querySelector('#strategy-status').textContent = 'Your deposits still enroll using strategy 01KZY1G56YFYWKS8AH0PR1YMQX. Live display requires strategies:read permission on your Glider API key.';
  }
}
loadLiveStrategy();
let portfolioId;
const portfolioStorageKey = address => `baseTenPortfolioId:${address.toLowerCase()}:01KZY1G56YFYWKS8AH0PR1YMQX`;

async function loadWithdrawableAssets() {
  if (!connectedAddress) return;
  const rebalanceButton = document.querySelector('#rebalance-all');
  portfolioId = localStorage.getItem(portfolioStorageKey(connectedAddress));
  if (!portfolioId) {
    const resolved = await post('/glider/portfolio/resolve', { userAddress: connectedAddress });
    portfolioId = resolved.data.portfolioId;
    if (portfolioId) localStorage.setItem(portfolioStorageKey(connectedAddress), portfolioId);
  }
  const submit = document.querySelector('#withdraw-submit');
  if (!portfolioId) {
    assetPicker.innerHTML = '<option>Invest USDC first</option>';
    submit.disabled = true;
    submit.textContent = 'Invest USDC before withdrawing';
    rebalanceButton.disabled = true;
    return;
  }
  rebalanceButton.disabled = false;
  try {
    document.querySelector('#withdraw-balance').textContent = 'Loading indexed portfolio balance…';
    const positions = await post('/glider/positions', { portfolioId });
    withdrawAssets = (positions.data.assets || []).filter(asset => asset.smartAccountId?.startsWith('eip155:8453:') && BigInt(asset.balanceRaw || '0') > 0n);
    if (!withdrawAssets.length) {
      assetPicker.innerHTML = '<option>Deposit is indexing — check again shortly</option>';
      document.querySelector('#withdraw-balance').textContent = 'Your transfer is not indexed yet. Glider may take a few minutes to show it.';
      submit.disabled = true;
      submit.textContent = 'No indexed assets to withdraw';
      return;
    }
    assetPicker.innerHTML = withdrawAssets.map(asset => `<option value="${asset.assetId}">${asset.symbol} — ${asset.balance} available</option>`).join('');
    assetPicker.dispatchEvent(new Event('change'));
    submit.disabled = false;
    submit.textContent = 'Withdraw to my Base wallet';
    const value = Number(positions.data.totalValueUsd || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    document.querySelector('.balance').textContent = value;
    document.querySelector('#tvl').textContent = value;
  } catch (error) {
    submit.disabled = true;
    submit.textContent = 'Unable to load withdrawal balance';
    document.querySelector('#withdraw-balance').textContent = error.message || 'Unable to load portfolio positions.';
  }
}

document.querySelector('#withdraw-submit').addEventListener('click', async () => {
  await connectWallet();
  if (!connectedAddress || !portfolioId || !window.ethers) return;
  const asset = withdrawAssets.find(item => item.assetId === assetPicker.value);
  const amount = document.querySelector('#withdraw-amount').value.trim();
  if (!asset || !amount) return alert('Choose an indexed asset and enter the amount to withdraw.');
  let amountRaw;
  try { amountRaw = ethers.parseUnits(amount, Number(asset.decimals)).toString(); }
  catch { return alert(`Enter a valid ${asset.symbol} amount.`); }
  if (BigInt(amountRaw) <= 0n || BigInt(amountRaw) > BigInt(asset.balanceRaw)) return alert(`Enter an amount up to your available ${asset.balance} ${asset.symbol}.`);
  const button = document.querySelector('#withdraw-submit');
  try {
    button.disabled = true;
    button.textContent = 'Preparing secure withdrawal…';
    const prepared = await post('/glider/withdraw/prepare', { portfolioId, recipientAddress: connectedAddress, assetId: asset.assetId, amountRaw });
    const typedData = prepared.data.typedData;
    const types = Object.fromEntries(Object.entries(typedData.types).filter(([key]) => key !== 'EIP712Domain'));
    button.textContent = 'Sign withdrawal in your wallet…';
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signature = await (await provider.getSigner()).signTypedData(typedData.domain, types, typedData.message);
    button.textContent = 'Submitting withdrawal…';
    const result = await post('/glider/withdraw/submit', { portfolioId, message: typedData.message, signature });
    button.textContent = 'Withdrawal submitted ✓';
    alert(`Withdrawal submitted. Glider is sending ${amount} ${asset.symbol} to your Base wallet. Operation: ${result.data.operationId}`);
    setTimeout(loadWithdrawableAssets, 4000);
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Withdraw to my Base wallet';
    alert(`Withdrawal was not completed: ${error.message || 'Unknown error'}`);
  }
});

document.querySelector('#invest-usdc').addEventListener('click', async () => {
  await connectWallet();
  if (!connectedAddress) return;
  // Keep a portfolio link per wallet and strategy. This prevents an earlier
  // browser session or a different wallet from accidentally being reused.
  portfolioId = localStorage.getItem(portfolioStorageKey(connectedAddress));
  if (!portfolioId) {
    const resolved = await post('/glider/portfolio/resolve', { userAddress: connectedAddress });
    portfolioId = resolved.data.portfolioId;
    if (portfolioId) localStorage.setItem(portfolioStorageKey(connectedAddress), portfolioId);
  }
  const amount = document.querySelector('#amount').value;
  if (Number(amount) < 1) return alert('Minimum investment is 1 USDC.');
  if (!window.ethers) { alert('The wallet transaction library did not load. Refresh and try again.'); return; }
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const button = document.querySelector('#invest-usdc');
    button.disabled = true;
    if (!portfolioId) {
      button.textContent = 'Creating your Glider Base account…';
      const signatureRequest = await post('/glider/signature', { userAddress: connectedAddress });
      const signatureData = signatureRequest.data;
      const signableMessage = signatureData.message?.raw ?? signatureData.message;
      const signature = await signer.signMessage(
        typeof signableMessage === 'string' && signableMessage.startsWith('0x')
          ? ethers.getBytes(signableMessage)
          : signableMessage
      );
      const created = await post('/glider/create', { ...signatureData, signature, portfolioName: 'Base Ten' });
      portfolioId = created.data.portfolioId;
      localStorage.setItem(portfolioStorageKey(connectedAddress), portfolioId);
    }
    button.textContent = 'Preparing USDC deposit…';
    const instruction = await post('/glider/deposit', { portfolioId, amount, userWalletAddress: connectedAddress });
    const { destination, tokenAmount, tokenContractAddress: usdcAddress } = instruction.data;
    document.querySelector('#deposit-destination').textContent = `Destination: your Glider Base smart account ${destination.slice(0, 10)}…${destination.slice(-8)}`;
    const rawAmount = BigInt(tokenAmount);
    const usdc = new ethers.Contract(usdcAddress, [
      'function balanceOf(address) view returns (uint256)',
      'function transfer(address,uint256) returns (bool)'
    ], signer);
    const balance = await usdc.balanceOf(connectedAddress);
    if (balance < rawAmount) throw new Error('Your connected Base wallet does not have enough official Base USDC for this amount.');
    button.textContent = 'Confirm USDC transfer to Glider account…';
    const funding = await usdc.transfer(destination, rawAmount);
    button.textContent = 'Confirming USDC transfer…';
    await funding.wait();
    const tx = funding.hash;
    button.textContent = 'Investment submitted ✓';
    document.querySelector('#rebalance-all').disabled = false;
    alert(`Your USDC was sent to your Glider Base account. It may take a short time to index before you can rebalance. Transaction: ${tx}`);
    setTimeout(loadWithdrawableAssets, 4000);
  } catch (error) {
    document.querySelector('#invest-usdc').disabled = false;
    document.querySelector('#invest-usdc').textContent = 'Invest USDC';
    alert(`Investment was not completed: ${error.message || 'Unknown error'}`);
  }
});
document.querySelector('#rebalance-all').addEventListener('click', async () => {
  await connectWallet();
  if (!connectedAddress) return;
  portfolioId = localStorage.getItem(portfolioStorageKey(connectedAddress));
  if (!portfolioId) {
    const resolved = await post('/glider/portfolio/resolve', { userAddress: connectedAddress });
    portfolioId = resolved.data.portfolioId;
    if (portfolioId) localStorage.setItem(portfolioStorageKey(connectedAddress), portfolioId);
  }
  if (!portfolioId) return alert('No Glider portfolio exists for this wallet and strategy yet. Deposit USDC first.');
  const button = document.querySelector('#rebalance-all');
  const status = document.querySelector('#rebalance-status');
  try {
    button.disabled = true;
    button.textContent = 'Requesting Glider rebalance…';
    status.textContent = 'Glider is checking your portfolio and preparing the strategy execution.';
    const result = await post('/glider/rebalance', { portfolioId });
    button.textContent = 'Glider rebalance requested ✓';
    status.textContent = `Glider accepted the rebalance request. Operation: ${result.data.operationId || 'processing'}.`;
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Ask Glider to rebalance';
    status.textContent = `Glider could not rebalance yet: ${error.message || 'Unknown error'}`;
  }
});
