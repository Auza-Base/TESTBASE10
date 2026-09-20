const portfolio = [
  ['NVDAc', 18, 'NVIDIA'], ['AAPLc', 15, 'Apple'], ['GOOGLc', 14, 'Alphabet'],
  ['METAc', 9, 'Meta'], ['AMZNc', 11, 'Amazon'], ['MSFTc', 13, 'Microsoft'],
  ['MSTRc', 5, 'Strategy'], ['SNDKc', 3, 'SanDisk'], ['SPCXc', 5, 'SpaceX'], ['TSLAc', 7, 'Tesla']
];
const appNotice = document.querySelector('#app-notice');
const appNoticeMessage = document.querySelector('#app-notice-message');
function alert(message) {
  appNoticeMessage.textContent = String(message || 'Something needs your attention.');
  if (!appNotice.open) appNotice.showModal();
}
document.querySelector('#app-notice-close').addEventListener('click', () => appNotice.close());
appNotice.addEventListener('click', event => { if (event.target === appNotice) appNotice.close(); });
const grid = document.querySelector('#allocation-grid');
const localLogos = { NVDAc: 'nvidia.com', AAPLc: 'apple.com', GOOGLc: 'google.com', METAc: 'meta.com', AMZNc: 'amazon.com', MSFTc: 'microsoft.com', MSTRc: 'strategy.com', SNDKc: 'sandisk.com', SPCXc: 'spacex.com', TSLAc: 'tesla.com' };
const companyLogo = domain => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
grid.innerHTML = portfolio.map(([ticker, weight, name]) => `<article class="asset"><div class="asset-top"><img class="asset-logo" src="${companyLogo(localLogos[ticker])}" alt="${name} logo" /><div class="asset-weight">${weight}%</div></div><div class="asset-ticker">${ticker}</div><div class="asset-name">${name}</div><div class="asset-bar" style="width:${weight * 5.55}%"></div></article>`).join('');
const assetPicker = document.querySelector('#withdraw-asset');
const withdrawAmount = document.querySelector('#withdraw-amount');
const withdrawMax = document.querySelector('#withdraw-max');
const withdrawLogo = document.querySelector('#withdraw-logo');
const withdrawHint = document.querySelector('#withdraw-hint');
const toggleComposition = document.querySelector('#toggle-composition');
const compositionContent = document.querySelector('#composition-content');
toggleComposition.addEventListener('click', () => {
  const hidden = compositionContent.hidden = !compositionContent.hidden;
  toggleComposition.textContent = hidden ? 'Show ↓' : 'Hide ↑';
  toggleComposition.setAttribute('aria-expanded', String(!hidden));
});
let withdrawAssets = [];
assetPicker.addEventListener('change', () => {
  const asset = withdrawAssets.find(item => item.assetId === assetPicker.value);
  document.querySelector('#withdraw-symbol').textContent = asset?.symbol || 'USDC';
  document.querySelector('#withdraw-balance').textContent = asset ? `Available: ${asset.balance} ${asset.symbol}` : 'Select an indexed portfolio asset.';
  if (asset) {
    const contract = asset.assetId.split('erc20:')[1]?.toLowerCase();
    const known = knownAssetByAddress[contract] || knownAssets[String(asset.symbol || '').toLowerCase()];
    withdrawLogo.src = known?.logo || (String(asset.symbol).toUpperCase() === 'USDC' ? 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040' : 'https://www.google.com/s2/favicons?domain=glider.fi&sz=128');
    withdrawLogo.alt = `${asset.symbol} logo`;
  }
  // The user chooses the amount. Only the MAX button may fill the full balance.
  withdrawAmount.value = '';
  withdrawAmount.placeholder = asset ? `Amount of ${asset.symbol}` : 'Select an asset first';
  withdrawHint.textContent = asset ? `Enter ${asset.symbol} token units here — not a USDC dollar amount. Available: ${asset.balance} ${asset.symbol}.` : 'Select an indexed asset first.';
  withdrawMax.disabled = !asset;
});
withdrawMax.addEventListener('click', () => {
  const asset = withdrawAssets.find(item => item.assetId === assetPicker.value);
  if (!asset) return;
  withdrawAmount.value = asset.balance;
  document.querySelector('#withdraw-balance').textContent = `Max selected: ${asset.balance} ${asset.symbol}`;
});

const walletDialog = document.querySelector('#wallet-dialog');
const walletStatus = document.querySelector('#wallet-status');
const walletSearch = document.querySelector('#wallet-search');
let activeProvider;
let connectedAddress;
const baseNetwork = {
  chainId: '0x2105', chainName: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org']
};
const walletNames = { metamask: 'MetaMask', coinbase: 'Coinbase Wallet', rabby: 'Rabby', okx: 'OKX Wallet' };
const announcedProviders = [];
// EIP-6963 discovers several installed browser wallets without a third-party
// service, API key, or WalletConnect project. Wallets that do not implement it
// are still collected from the legacy window.ethereum provider list.
window.addEventListener('eip6963:announceProvider', event => {
  if (event.detail?.provider && !announcedProviders.some(item => item.provider === event.detail.provider)) announcedProviders.push(event.detail);
});
window.dispatchEvent(new Event('eip6963:requestProvider'));
const uniqueProviders = () => [...new Set([...announcedProviders.map(item => item.provider), window.ethereum, ...(window.ethereum?.providers || [])].filter(Boolean))];
function findWalletProvider(wallet) {
  return uniqueProviders().find(provider => (
    (wallet === 'metamask' && provider.isMetaMask && !provider.isRabby) ||
    (wallet === 'coinbase' && provider.isCoinbaseWallet) ||
    (wallet === 'rabby' && provider.isRabby) ||
    (wallet === 'okx' && (provider.isOkxWallet || provider.isOKExWallet))
  ));
}
function updateWalletChoices() {
  document.querySelectorAll('[data-wallet]').forEach(button => {
    const installed = Boolean(findWalletProvider(button.dataset.wallet));
    button.disabled = !installed;
    button.title = installed ? `Connect ${walletNames[button.dataset.wallet]}` : `${walletNames[button.dataset.wallet]} is not installed in this browser`;
  });
  // Add every other EIP-6963 wallet extension detected by the browser.
  const options = document.querySelector('#wallet-options');
  options.querySelectorAll('[data-discovered-wallet]').forEach(button => button.remove());
  announcedProviders.forEach((item, index) => {
    const provider = item.provider;
    if (uniqueProviders().filter(candidate => candidate === provider).some(() => provider.isMetaMask || provider.isCoinbaseWallet || provider.isRabby || provider.isOkxWallet || provider.isOKExWallet)) return;
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.discoveredWallet = String(index);
    button.innerHTML = `<img class="wallet-icon" src="${item.info?.icon || 'https://www.google.com/s2/favicons?domain=walletconnect.com&sz=128'}" alt="" /><span>${item.info?.name || 'Browser wallet'}</span><small class="wallet-installed">● Installed</small>`;
    options.insertBefore(button, options.querySelector('[data-walletconnect]'));
  });
  walletStatus.textContent = uniqueProviders().length ? 'Choose an available wallet above.' : 'No supported browser wallet was detected. Install or unlock MetaMask, Coinbase Wallet, Rabby, or OKX Wallet, then refresh.';
}
function openWalletDialog() {
  updateWalletChoices();
  if (typeof walletDialog.showModal === 'function') walletDialog.showModal();
  else alert('Open a supported browser wallet (MetaMask, Coinbase Wallet, Rabby, or OKX Wallet) and refresh this page.');
}
walletSearch.addEventListener('input', () => {
  const query = walletSearch.value.trim().toLowerCase();
  document.querySelectorAll('#wallet-options button').forEach(button => {
    button.hidden = Boolean(query) && !button.textContent.toLowerCase().includes(query);
  });
});
document.querySelector('#wallet-close').addEventListener('click', () => walletDialog.close());
document.querySelector('#wallet-options').addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.hasAttribute('data-walletconnect')) { walletStatus.style.display = 'block'; walletStatus.textContent = 'Mobile wallet connections need a WalletConnect or Dynamic project configuration. Browser-extension wallets are available now.'; return; }
  const provider = button.dataset.discoveredWallet != null ? announcedProviders[Number(button.dataset.discoveredWallet)]?.provider : findWalletProvider(button.dataset.wallet);
  if (!provider) return;
  activeProvider = provider;
  walletDialog.close();
  await connectWallet();
});
async function switchToBase(provider) {
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: baseNetwork.chainId }] });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await provider.request({ method: 'wallet_addEthereumChain', params: [baseNetwork] });
  }
}
async function connectWallet(refreshAssets = true) {
  const provider = activeProvider || window.ethereum;
  if (!provider) { openWalletDialog(); return; }
  try {
    // Most wallets require the account connection before they accept a network switch.
    const [address] = await provider.request({ method: 'eth_requestAccounts' });
    await switchToBase(provider);
    const hadConnectedWallet = Boolean(connectedAddress);
    const accountChanged = hadConnectedWallet && connectedAddress.toLowerCase() !== address.toLowerCase();
    connectedAddress = address;
    document.querySelectorAll('.wallet-button').forEach(item => item.textContent = `${address.slice(0, 6)}…${address.slice(-4)}`);
    document.querySelector('.status').textContent = 'BASE CONNECTED';
    if (refreshAssets || accountChanged || !hadConnectedWallet) await loadWithdrawableAssets();
  } catch (error) {
    const message = error?.code === 4001
      ? 'Wallet connection was cancelled. Approve the wallet connection and Base network switch, then try again.'
      : `Wallet connection failed: ${error?.message || 'Your wallet did not return an account.'}`;
    alert(message);
  }
}
document.querySelectorAll('.wallet-button').forEach(button => button.addEventListener('click', openWalletDialog));

const apiBase = window.BASE_TEN_CONFIG?.apiBase || '/api';
const post = async (path, payload) => {
  const route = path.replace(/^\/glider\/?/, '');
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const endpoint = isLocal ? `${apiBase}/glider/${route}` : `${apiBase}/glider`;
  const body = isLocal ? payload : { ...payload, route };
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.error?.message || result.error || 'Request failed');
  return result;
};
const logo = companyLogo;
const knownAssets = Object.fromEntries(portfolio.map(([symbol, , name]) => [symbol.toLowerCase(), { symbol, name }]));
Object.assign(knownAssets, {
  nvdac: { ...knownAssets.nvdac, logo: logo('nvidia.com') },
  aaplc: { ...knownAssets.aaplc, logo: logo('apple.com') },
  googlc: { ...knownAssets.googlc, logo: logo('google.com') },
  metac: { ...knownAssets.metac, logo: logo('meta.com') },
  amznc: { ...knownAssets.amznc, logo: logo('amazon.com') },
  msftc: { ...knownAssets.msftc, logo: logo('microsoft.com') },
  mstrc: { ...knownAssets.mstrc, logo: logo('strategy.com') },
  sndkc: { ...knownAssets.sndkc, logo: logo('sandisk.com') },
  spcxc: { ...knownAssets.spcxc, logo: logo('spacex.com') },
  spcx: { ...knownAssets.spcxc, logo: logo('spacex.com') },
  tslac: { ...knownAssets.tslac, logo: logo('tesla.com') }
});
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
  '0xb2000000000000000000001e800a7f5189430cd0': knownAssets.tslac
};
const usd = value => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
function renderInvestmentValue(positions) {
  const assets = positions.data?.assets || [];
  const total = positions.data?.totalValueUsd || 0;
  document.querySelector('#investment-value').textContent = usd(total);
  document.querySelector('#tvl').textContent = usd(total);
  document.querySelector('#asset-count').textContent = String(assets.filter(asset => BigInt(asset.balanceRaw || '0') > 0n).length);
  document.querySelector('#portfolio-value-note').textContent = `Live Glider value · updated ${new Date(positions.data?.fetchedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const rows = document.querySelector('#holdings-rows');
  const held = assets.filter(asset => BigInt(asset.balanceRaw || '0') > 0n);
  if (!held.length) { rows.className = 'holdings-empty'; rows.textContent = 'No indexed assets yet. Deposits can take a few minutes to appear in Glider.'; return; }
  rows.className = 'holdings-rows';
  rows.innerHTML = held.map(asset => {
    const contract = asset.assetId.split('erc20:')[1]?.toLowerCase();
    const known = knownAssetByAddress[contract] || knownAssets[String(asset.symbol || '').toLowerCase()];
    const icon = known?.logo || (String(asset.symbol).toUpperCase() === 'USDC' ? 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040' : 'https://www.google.com/s2/favicons?domain=glider.fi&sz=128');
    return `<div class="holding-row"><span class="holding-asset"><img src="${icon}" alt="" /><b>${asset.symbol || 'Asset'}</b></span><span>${asset.balance || '0'}</span><span>${usd(asset.priceUsd)}</span><span class="pnl-unavailable">—</span><strong>${usd(asset.valueUsd)}</strong></div>`;
  }).join('');
}
async function loadLiveStrategy() {
  try {
    const strategy = (await post('/glider/strategy', {})).data;
    const assets = strategy.allocation?.assets || [];
    if (!assets.length) throw new Error('Strategy returned no allocation.');
    document.querySelector('#strategy-name').textContent = 'Bitwise Mag7x';
    document.querySelector('#strategy-status').textContent = 'Live allocation powered by Glider on Base.';
    document.querySelector('#snapshot-holdings').textContent = String(assets.length);
    document.querySelector('#snapshot-largest').textContent = `${Math.max(...assets.map(asset => Number(asset.weight) || 0))}%`;
    grid.innerHTML = assets.map(asset => {
      const address = asset.assetId.split('erc20:')[1]?.toLowerCase();
      const known = knownAssetByAddress[address];
      const label = known?.symbol || asset.assetId.split('/').pop().slice(-12);
      const name = known?.name || asset.assetId;
      const weight = Number(asset.weight);
      const assetLogo = known?.logo ? `<img class="asset-logo" src="${known.logo}" alt="${name} logo" />` : `<img class="asset-logo" src="https://www.google.com/s2/favicons?domain=glider.fi&sz=128" alt="Asset logo" />`;
      return `<article class="asset"><div class="asset-top">${assetLogo}<div class="asset-weight">${weight}%</div></div><div class="asset-ticker">${label}</div><div class="asset-name">${name}</div><div class="asset-bar" style="width:${Math.max(0, Math.min(100, weight))}%"></div></article>`;
    }).join('');
  } catch (error) {
    document.querySelector('#strategy-name').textContent = 'Bitwise Mag7x';
    document.querySelector('#strategy-status').textContent = 'Your deposits still enroll using strategy 01KZY1G56YFYWKS8AH0PR1YMQX. Live display requires strategies:read permission on your Glider API key.';
  }
}
loadLiveStrategy();
let leaderboardData;
async function loadLeaderboard() {
  const rows = document.querySelector('#leaderboard-rows');
  const refresh = document.querySelector('#refresh-leaderboard');
  if (!rows || !refresh) return;
  try {
    refresh.disabled = true;
    refresh.textContent = 'Refreshing…';
    const data = (await post('/glider/leaderboard', {})).data;
    leaderboardData = data;
    document.querySelector('#leaderboard-count').textContent = String(data.walletCount ?? 0);
    document.querySelector('#leaderboard-count-label').textContent = `${data.portfolioCount ?? 0} portfolios · wallets`;
    document.querySelector('#leaderboard-tvl').textContent = `${usd(data.totalValueUsd)} TVL`;
    const listed = data.rows || [];
    if (!listed.length) {
      rows.className = 'empty-leaders';
      rows.textContent = 'No portfolios have been created for this strategy yet.';
    } else {
      rows.className = '';
      rows.innerHTML = listed.map(row => {
        const contracts = (row.portfolioAddresses || []).map(item => `<a class="portfolio-contract" href="https://basescan.org/address/${item.address}" target="_blank" rel="noreferrer" title="View on BaseScan">${item.address} ↗</a>`).join('') || 'Pending';
        return `<div class="leader-row"><span>#${row.rank}</span><span>${row.wallet}<small>${row.status === 'active' ? 'Active' : 'Not scheduled'} · ${row.portfolioCount} portfolio${row.portfolioCount === 1 ? '' : 's'}</small></span><span class="portfolio-contracts">${contracts}</span><span>${usd(row.valueUsd)}</span><strong class="tvl-share">${Number(row.tvlSharePercent || 0).toFixed(2)}%</strong></div>`;
      }).join('');
    }
    const updated = new Date(data.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.querySelector('#leaderboard-note').textContent = `Updated ${updated}. Wallet labels are shortened; portfolio names and individual holdings are never shown.`;
  } catch (error) {
    rows.className = 'empty-leaders';
    rows.textContent = 'Community data is unavailable until the Glider API key has portfolios:read access.';
    document.querySelector('#leaderboard-note').textContent = 'The leaderboard only displays anonymized data for this strategy.';
  } finally {
    refresh.disabled = false;
    refresh.textContent = 'Refresh';
  }
}
document.querySelector('#refresh-leaderboard')?.addEventListener('click', loadLeaderboard);
document.querySelector('#download-portfolio-addresses')?.addEventListener('click', () => {
  const addresses = (leaderboardData?.rows || []).flatMap(row => row.portfolioAddresses || []);
  if (!addresses.length) return alert('There are no Base portfolio contract addresses available to download yet.');
  const csv = ['portfolio_contract_address,current_value_usd,status', ...addresses.map(item => `${item.address},${Number(item.valueUsd || 0).toFixed(2)},${item.status}`)].join('\n');
  const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url; link.download = 'bitwise-mag7x-portfolio-addresses.csv'; link.click();
  URL.revokeObjectURL(url);
});
loadLeaderboard();
let portfolioId;
const portfolioStorageKey = address => `baseTenPortfolioId:${address.toLowerCase()}:01KZY1G56YFYWKS8AH0PR1YMQX`;
const activityStorageKey = address => `baseStock10Activity:${address.toLowerCase()}`;
function saveActivity(type, detail, hash = '') {
  if (!connectedAddress) return;
  const items = JSON.parse(localStorage.getItem(activityStorageKey(connectedAddress)) || '[]');
  items.unshift({ type, detail, hash, at: Date.now() });
  localStorage.setItem(activityStorageKey(connectedAddress), JSON.stringify(items.slice(0, 30)));
}
function renderActivity(performance) {
  const rows = document.querySelector('#activity-rows');
  if (!rows) return;
  const local = connectedAddress ? JSON.parse(localStorage.getItem(activityStorageKey(connectedAddress)) || '[]') : [];
  const flows = (performance?.data?.points || []).filter(point => Number(point.cashFlowUsd || 0) !== 0).map(point => ({ type: Number(point.cashFlowUsd) > 0 ? 'Deposit indexed' : 'Withdrawal indexed', detail: `${Number(point.cashFlowUsd) > 0 ? '+' : '−'}${usd(Math.abs(Number(point.cashFlowUsd)))}`, at: new Date(`${point.date}T12:00:00Z`).getTime() }));
  const activity = [...local, ...flows].sort((a, b) => b.at - a.at).slice(0, 20);
  if (!activity.length) { rows.className = 'holdings-empty'; rows.textContent = 'No indexed activity yet. Deposits and withdrawals appear after Glider indexes them.'; return; }
  rows.className = 'activity-rows';
  rows.innerHTML = activity.map(item => `<div class="activity-row"><span class="activity-kind ${item.type.toLowerCase().includes('withdraw') ? 'negative' : ''}">${item.type}</span><span>${item.detail}</span><span>${new Date(item.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>`).join('');
}

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
    withdrawMax.disabled = true;
    rebalanceButton.disabled = true;
    return;
  }
  rebalanceButton.disabled = false;
  try {
    document.querySelector('#withdraw-balance').textContent = 'Loading indexed portfolio balance…';
    const positions = await post('/glider/positions', { portfolioId });
    renderInvestmentValue(positions);
    let performance;
    try {
      performance = await post('/glider/performance', { portfolioId });
      const allTime = performance.data?.summary?.windows?.find(item => item.window === 'all');
      if (allTime?.percentChange != null) {
        const change = Number(allTime.percentChange);
        const node = document.querySelector('#portfolio-return');
        node.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        node.className = change >= 0 ? 'positive-return' : 'negative-return';
      }
    } catch { /* Glider needs indexed portfolio history before it can calculate return. */ }
    renderActivity(performance);
    withdrawAssets = (positions.data.assets || []).filter(asset => asset.smartAccountId?.startsWith('eip155:8453:') && BigInt(asset.balanceRaw || '0') > 0n);
    if (!withdrawAssets.length) {
      assetPicker.innerHTML = '<option>Deposit is indexing — check again shortly</option>';
      document.querySelector('#withdraw-balance').textContent = 'Your transfer is not indexed yet. Glider may take a few minutes to show it.';
      submit.disabled = true;
      submit.textContent = 'No indexed assets to withdraw';
      withdrawMax.disabled = true;
      return;
    }
    const previousAssetId = assetPicker.value;
    withdrawAssets.sort((a, b) => {
      const aUsdc = String(a.symbol).toUpperCase() === 'USDC';
      const bUsdc = String(b.symbol).toUpperCase() === 'USDC';
      return Number(bUsdc) - Number(aUsdc);
    });
    assetPicker.innerHTML = withdrawAssets.map(asset => `<option value="${asset.assetId}">${asset.symbol} — ${asset.balance} available</option>`).join('');
    assetPicker.value = withdrawAssets.some(asset => asset.assetId === previousAssetId) ? previousAssetId : withdrawAssets[0].assetId;
    assetPicker.dispatchEvent(new Event('change'));
    submit.disabled = false;
    withdrawMax.disabled = false;
    submit.textContent = 'Withdraw to my Base wallet';
  } catch (error) {
    submit.disabled = true;
    submit.textContent = 'Unable to load withdrawal balance';
    withdrawMax.disabled = true;
    document.querySelector('#withdraw-balance').textContent = error.message || 'Unable to load portfolio positions.';
  }
}

document.querySelector('#withdraw-submit').addEventListener('click', async () => {
  // Do not reload the picker here: reloading would clear the amount the user
  // already entered. A first connection or a wallet change still loads assets.
  await connectWallet(false);
  if (!connectedAddress || !portfolioId || !window.ethers) return;
  const asset = withdrawAssets.find(item => item.assetId === assetPicker.value);
  const amount = document.querySelector('#withdraw-amount').value.trim();
  if (!asset) return alert('No withdrawable asset is indexed yet. After depositing or rebalancing, wait for Glider to index the asset, then refresh this page.');
  if (!amount) return alert(`Enter an amount of ${asset.symbol}, or press MAX to withdraw your full available balance.`);
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
    const provider = new ethers.BrowserProvider(activeProvider || window.ethereum);
    const signature = await (await provider.getSigner()).signTypedData(typedData.domain, types, typedData.message);
    button.textContent = 'Submitting withdrawal…';
    const result = await post('/glider/withdraw/submit', { portfolioId, message: typedData.message, signature });
    saveActivity('Withdrawal submitted', `${amount} ${asset.symbol}`, result.data.operationId || '');
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
    const provider = new ethers.BrowserProvider(activeProvider || window.ethereum);
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
      const created = await post('/glider/create', { ...signatureData, signature, portfolioName: 'BaseStock10' });
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
    saveActivity('USDC deposit submitted', `${amount} USDC`, tx);
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
    saveActivity('Glider rebalance requested', 'Strategy execution requested', result.data.operationId || '');
    button.textContent = 'Glider rebalance requested ✓';
    status.textContent = `Glider accepted the rebalance request. Operation: ${result.data.operationId || 'processing'}.`;
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Ask Glider to rebalance';
    status.textContent = `Glider could not rebalance yet: ${error.message || 'Unknown error'}`;
  }
});
