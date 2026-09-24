const portfolio = [
  ['NVDAc', 18, 'NVIDIA'], ['AAPLc', 15, 'Apple'], ['GOOGLc', 14, 'Alphabet'],
  ['METAc', 9, 'Meta'], ['AMZNc', 11, 'Amazon'], ['MSFTc', 13, 'Microsoft'],
  ['MSTRc', 5, 'Strategy'], ['SNDKc', 3, 'SanDisk'], ['SPCXc', 5, 'SpaceX'], ['TSLAc', 7, 'Tesla']
];
const rewardAssetAddresses = {
  NVDAc: '0xb20000000000000000000078ee7ce2fE4908108C', AAPLc: '0xb200000000000000000000C2e324d24d7eEcd1fb',
  GOOGLc: '0xb2000000000000000000002D0BA3164cc74f58B7', METAc: '0xb2000000000000000000008bC8786B856E61707C',
  AMZNc: '0xb200000000000000000000d9192b6B456483C2E8', MSFTc: '0xB200000000000000000000Ab99cFa739E253872B',
  MSTRc: '0xb2000000000000000000004884b426556b92883d', SNDKc: '0xb200000000000000000000397293Cb8cda9a10c5',
  SPCXc: '0xb2000000000000000000007b9fcbd005511aCBd5', TSLAc: '0xb2000000000000000000001e800a7f5189430cD0'
};
const appNotice = document.querySelector('#app-notice');
const appNoticeMessage = document.querySelector('#app-notice-message');
// The Privy bundle loads after this app shell. A click during startup should
// wait briefly and then open Privy, not interrupt the person with a popup.
window.BaseStockWallet = window.BaseStockWallet || {
  ready: false,
  getSession: () => null,
  open: () => {}
};
window.addEventListener('error', event => {
  if (!/bs10-connect|privy-wallet/.test(String(event.filename || ''))) return;
  window.BaseStockWallet = {
    ready: true,
    getSession: () => null,
    open: () => alert('Wallet connection could not load: ' + (event.message || 'Unknown browser error') + '. Refresh and try again.')
  };
});
window.addEventListener('unhandledrejection', event => {
  if (!String(event.reason?.message || event.reason || '').toLowerCase().includes('privy')) return;
  window.BaseStockWallet = {
    ready: true,
    getSession: () => null,
    open: () => alert('Wallet connection could not start: ' + (event.reason?.message || event.reason) + '. Refresh and try again.')
  };
});
function alert(message) {
  appNoticeMessage.textContent = String(message || 'Something needs your attention.');
  if (!appNotice.open) appNotice.showModal();
}
document.querySelector('#app-notice-close').addEventListener('click', () => appNotice.close());
appNotice.addEventListener('click', event => { if (event.target === appNotice) appNotice.close(); });
const grid = document.querySelector('#allocation-grid');
const localLogos = { NVDAc: 'nvidia.com', AAPLc: 'apple.com', GOOGLc: 'google.com', METAc: 'meta.com', AMZNc: 'amazon.com', MSFTc: 'microsoft.com', MSTRc: 'strategy.com', SNDKc: 'sandisk.com', SPCXc: 'spacex.com', TSLAc: 'tesla.com' };
const companyLogo = domain => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
function applyRandomStockCursor() {
  if (!document.documentElement || typeof Image === 'undefined') return;
  if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;
  const domains = Object.values(localLogos);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cursorUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const cursorImage = new Image();
  cursorImage.onload = () => {
    document.documentElement.style.setProperty('--stock-cursor', `url("${cursorUrl}") 16 16`);
    document.body.classList.add('stock-cursor');
  };
  cursorImage.src = cursorUrl;
}
applyRandomStockCursor();
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

let activeProvider;
let connectedAddress;
let walletRevision = 0;
let removeWalletListeners = () => {};
let walletLoadingStartedAt = 0;
let walletRetryScheduled = false;
let walletActionBusy = false;
let currentPositions = null;

function setDisconnectedWalletButtonText(label = 'Connect wallet') {
  if (connectedAddress) return;
  document.querySelectorAll('.wallet-button').forEach(button => { button.textContent = label; });
}

function resetWalletPortfolio() {
  currentPositions = null;
  window.BaseStockSafety?.reset();
  walletRevision++;
  portfolioId = undefined;
  withdrawAssets = [];
  withdrawAmount.value = '';
  assetPicker.innerHTML = '<option value="">Connect a wallet to see assets</option>';
  withdrawMax.disabled = true;
  document.querySelector('#withdraw-submit').disabled = true;
  document.querySelector('#rebalance-all').disabled = true;
  document.querySelector('#withdraw-balance').textContent = 'Connect your wallet to load your balance.';
  document.querySelector('#portfolio-return').textContent = '—';
  document.querySelector('#deposit-destination').textContent = '';
  renderInvestmentValue({ data: { assets: [], totalValueUsd: 0 } });
  currentPositions = null;
  document.querySelector('#portfolio-value-note').textContent = 'Connect your wallet to see your portfolio.';
}

function setWalletSession(session) {
  removeWalletListeners();
  removeWalletListeners = () => {};
  const changed = connectedAddress?.toLowerCase() !== session?.address?.toLowerCase();
  if (changed) resetWalletPortfolio();
  activeProvider = session?.provider;
  connectedAddress = session?.address;
  window.BaseStockSafety?.walletChanged();
  document.querySelectorAll('.wallet-button').forEach(button => {
    button.textContent = connectedAddress ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}` : 'Connect wallet';
  });
  document.querySelector('.status').textContent = connectedAddress ? 'WALLET CONNECTED' : 'NOT CONNECTED';
  if (!session) return;
  // Clear stale balances immediately if the extension changes accounts or disconnects.
  const invalidate = () => setWalletSession(null);
  const accountsChanged = accounts => {
    if (!accounts?.[0] || accounts[0].toLowerCase() !== connectedAddress?.toLowerCase()) invalidate();
  };
  session.provider.on?.('accountsChanged', accountsChanged);
  session.provider.on?.('disconnect', invalidate);
  removeWalletListeners = () => {
    session.provider.removeListener?.('accountsChanged', accountsChanged);
    session.provider.removeListener?.('disconnect', invalidate);
  };
  if (changed) loadWithdrawableAssets().catch(error => alert(`Wallet connected, but portfolio could not load: ${error.message}`));
}

function openWalletDialog() {
  if (window.BaseStockWallet?.ready) {
    walletLoadingStartedAt = 0;
    walletRetryScheduled = false;
    setDisconnectedWalletButtonText();
    window.BaseStockWallet.open();
    return;
  }
  if (!walletLoadingStartedAt) walletLoadingStartedAt = Date.now();
  setDisconnectedWalletButtonText('Opening wallet…');
  // Allow slower networks to finish loading Privy without making the user
  // click again. If a browser blocks it entirely, return quietly to Connect.
  if (Date.now() - walletLoadingStartedAt > 10000) {
    walletLoadingStartedAt = 0;
    walletRetryScheduled = false;
    setDisconnectedWalletButtonText();
    return;
  }
  if (!walletRetryScheduled) {
    walletRetryScheduled = true;
    setTimeout(() => {
      walletRetryScheduled = false;
      openWalletDialog();
    }, 150);
  }
}

async function connectWallet(refreshAssets = true) {
  const session = window.BaseStockWallet?.getSession();
  if (!session) { openWalletDialog(); return false; }
  try {
    const revision = walletRevision;
    await session.wallet.switchChain(8453);
    const accounts = await session.provider.request({ method: 'eth_accounts' });
    const chainId = await session.provider.request({ method: 'eth_chainId' });
    if (walletRevision !== revision || !accounts?.some(address => address.toLowerCase() === session.address.toLowerCase())) {
      throw new Error('Your wallet changed. Reconnect and try again.');
    }
    if (Number(chainId) !== 8453) throw new Error('Switch your wallet to Base to continue.');
    if (connectedAddress?.toLowerCase() !== session.address.toLowerCase()) setWalletSession(session);
    activeProvider = session.provider;
    document.querySelector('.status').textContent = 'BASE CONNECTED';
    if (refreshAssets) await loadWithdrawableAssets();
    return activeProvider === session.provider && connectedAddress?.toLowerCase() === session.address.toLowerCase();
  } catch (error) {
    alert(error?.code === 4001 ? 'Wallet request cancelled. Nothing was submitted.' : `Wallet connection failed: ${error.message || 'Please reconnect your wallet.'}`);
    return false;
  }
}

async function getVerifiedSigner(expectedAddress, expectedProvider) {
  if (!expectedProvider || activeProvider !== expectedProvider || connectedAddress?.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new Error('Your wallet changed. Start this action again.');
  }
  const provider = new ethers.BrowserProvider(expectedProvider);
  const signer = await provider.getSigner(expectedAddress);
  if (Number(await expectedProvider.request({ method: 'eth_chainId' })) !== 8453) throw new Error('Switch to Base before continuing.');
  return signer;
}

window.addEventListener('basestock:wallet', event => setWalletSession(event.detail));
window.addEventListener('basestock:wallet-error', event => alert(event.detail));
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
const rewardStockRows = document.querySelector('#reward-stock-rows');
if (rewardStockRows) rewardStockRows.innerHTML = portfolio.map(([symbol, weight, name], index) => {
  const contract = rewardAssetAddresses[symbol];
  const icon = localLogos[symbol] ? companyLogo(localLogos[symbol]) : 'https://www.google.com/s2/favicons?domain=glider.fi&sz=128';
  return `<div class="reward-stock-row"><span>${String(index + 1).padStart(2, '0')}</span><span class="reward-stock-name"><img src="${icon}" alt="${name} logo" /><b>${symbol}</b><small>${name}</small></span><span>${weight}%</span><a href="https://basescan.org/address/${contract}" target="_blank" rel="noreferrer" title="${contract}">${contract.slice(0, 8)}…${contract.slice(-6)} ↗</a><span class="reward-live"><i></i> Live on Base</span></div>`;
}).join('');
const usd = value => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
function renderInvestmentValue(positions) {
  currentPositions = positions.data;
  window.BaseStockSafety?.renderEligibility();
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
function saveActivity(type, detail, hash = '', meta = {}) {
  if (window.BaseStockSafety) return window.BaseStockSafety.record({ type, detail, hash, owner: connectedAddress, portfolioId, ...meta });
  if (!connectedAddress) return;
  const items = JSON.parse(localStorage.getItem(activityStorageKey(connectedAddress)) || '[]');
  items.unshift({ type, detail, hash, at: Date.now() });
  localStorage.setItem(activityStorageKey(connectedAddress), JSON.stringify(items.slice(0, 30)));
}
function renderActivity(performance) {
  if (window.BaseStockSafety) { window.BaseStockSafety.render(); return; }
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
  const revision = walletRevision;
  const owner = connectedAddress;
  const rebalanceButton = document.querySelector('#rebalance-all');
  let resolvedPortfolioId = localStorage.getItem(portfolioStorageKey(owner));
  if (!resolvedPortfolioId) {
    const resolved = await post('/glider/portfolio/resolve', { userAddress: owner });
    if (revision !== walletRevision) return;
    resolvedPortfolioId = resolved.data.portfolioId;
    if (resolvedPortfolioId) localStorage.setItem(portfolioStorageKey(owner), resolvedPortfolioId);
  }
  if (revision !== walletRevision) return;
  portfolioId = resolvedPortfolioId;
  const submit = document.querySelector('#withdraw-submit');
  if (!portfolioId) {
    currentPositions = null;
    window.BaseStockSafety?.renderEligibility();
    window.BaseStockSafety?.render();
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
    if (revision !== walletRevision) return;
    renderInvestmentValue(positions);
    let performance;
    try {
      performance = await post('/glider/performance', { portfolioId });
      if (revision !== walletRevision) return;
      const allTime = performance.data?.summary?.windows?.find(item => item.window === 'all');
      if (allTime?.percentChange != null) {
        const change = Number(allTime.percentChange);
        const node = document.querySelector('#portfolio-return');
        node.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        node.className = change >= 0 ? 'positive-return' : 'negative-return';
      }
    } catch { /* Glider needs indexed portfolio history before it can calculate return. */ }
    if (revision !== walletRevision) return;
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
    if (revision !== walletRevision) return;
    currentPositions = null;
    window.BaseStockSafety?.renderEligibility();
    submit.disabled = true;
    submit.textContent = 'Unable to load withdrawal balance';
    withdrawMax.disabled = true;
    document.querySelector('#withdraw-balance').textContent = error.message || 'Unable to load portfolio positions.';
  }
}

document.querySelector('#withdraw-submit').addEventListener('click', async () => {
  // Do not reload the picker here: reloading would clear the amount the user
  // already entered. A first connection or a wallet change still loads assets.
  if (!await connectWallet(false)) return;
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
  const withdrawalOwner = connectedAddress;
  const withdrawalProvider = activeProvider;
  const withdrawalPortfolio = portfolioId;
  if (walletActionBusy) return alert('Another action is in progress. Finish or cancel it first.');
  walletActionBusy = true;
  let withdrawalSubmitted = false;
  try {
    button.disabled = true;
    button.textContent = 'Preparing secure withdrawal…';
    const prepared = await post('/glider/withdraw/prepare', { portfolioId: withdrawalPortfolio, recipientAddress: withdrawalOwner, assetId: asset.assetId, amountRaw });
    const typedData = prepared.data.typedData;
    if (!window.BaseStockSafetyCore?.withdrawalMatches(typedData, { owner: withdrawalOwner, portfolioId: withdrawalPortfolio, assetId: asset.assetId, amountRaw })) throw new Error('The withdrawal authorization does not match your selected amount, asset, recipient, or Base network. Nothing was signed.');
    if (!await reviewAction({ title: 'Review withdrawal', amount: `${amount} ${asset.symbol}`, destination: withdrawalOwner, source: `Glider portfolio ${withdrawalPortfolio}`, fee: 'Not quoted by the withdrawal API. Network, execution, or provider fees may apply.', note: 'This withdraws the selected token, not its USDC value. Review the same amount and recipient in your wallet.' })) return;
    const types = Object.fromEntries(Object.entries(typedData.types).filter(([key]) => key !== 'EIP712Domain'));
    button.textContent = 'Sign withdrawal in your wallet…';
    const signer = await getVerifiedSigner(withdrawalOwner, withdrawalProvider);
    const signature = await signer.signTypedData(typedData.domain, types, typedData.message);
    await getVerifiedSigner(withdrawalOwner, withdrawalProvider);
    button.textContent = 'Submitting withdrawal…';
    withdrawalSubmitted = true;
    const result = await post('/glider/withdraw/submit', { portfolioId: withdrawalPortfolio, message: typedData.message, signature });
    saveActivity('Withdrawal', `${amount} ${asset.symbol}`, '', { owner: withdrawalOwner, portfolioId: withdrawalPortfolio, operationId: result.data.operationId, state: 'accepted' });
    button.textContent = 'Withdrawal submitted ✓';
    alert(`Withdrawal accepted for processing, not yet confirmed. Track its status in Transaction history. Operation: ${result.data.operationId}`);
    setTimeout(loadWithdrawableAssets, 4000);
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Withdraw to my Base wallet';
    if (withdrawalSubmitted) saveActivity('Withdrawal', `${amount} ${asset.symbol}`, '', { owner: withdrawalOwner, portfolioId: withdrawalPortfolio, state: 'unknown', error: 'Submission response unavailable. Check with Glider before retrying.' });
    window.BaseStockSafety?.status(withdrawalSubmitted ? 'Submission status unknown. Refresh history before trying again.' : 'Withdrawal stopped before submission.', 'error');
    alert(`${withdrawalSubmitted ? 'Withdrawal submission could not be verified. Do not retry until you check its status.' : 'Withdrawal was not completed:'} ${error.message || 'Unknown error'}`);
  } finally {
    walletActionBusy = false;
    button.disabled = !connectedAddress || !withdrawAssets.length;
    button.textContent = connectedAddress ? 'Withdraw to my Base wallet' : 'Connect wallet to withdraw';
  }
});

document.querySelector('#invest-usdc').addEventListener('click', async () => {
  if (!await connectWallet()) return;
  if (!connectedAddress) return;
  // connectWallet loaded the portfolio for this exact wallet and strategy.
  const amount = document.querySelector('#amount').value;
  if (!/^\d+(\.\d{1,6})?$/.test(amount)) return alert('Enter a valid USDC amount with up to 6 decimal places.');
  if (Number(amount) < 25) return alert('Minimum investment is 25 USDC.');
  if (!window.ethers) { alert('The wallet transaction library did not load. Refresh and try again.'); return; }
  if (walletActionBusy) return alert('Another action is in progress. Finish or cancel it first.');
  walletActionBusy = true;
  const investmentOwner = connectedAddress;
  const investmentProvider = activeProvider;
  let fundingHash;
  let investmentPortfolio;
  try {
    const signer = await getVerifiedSigner(investmentOwner, investmentProvider);
    const button = document.querySelector('#invest-usdc');
    button.disabled = true;
    if (!portfolioId) {
      if (!await reviewAction({ title: 'Set up your Glider account', amount: 'No deposit in this step', destination: 'Glider enrollment on Base', source: investmentOwner, fee: 'Enrollment costs are not quoted by this API.', note: 'The next signature authorizes Glider enrollment and trading permissions. Read those permissions in your wallet. You will separately review the exact USDC transfer before sending funds.' })) return;
      await getVerifiedSigner(investmentOwner, investmentProvider);
      button.textContent = 'Creating your Glider Base account…';
      const signatureRequest = await post('/glider/signature', { userAddress: connectedAddress });
      await getVerifiedSigner(investmentOwner, investmentProvider);
      const signatureData = signatureRequest.data;
      const signableMessage = signatureData.message?.raw ?? signatureData.message;
      const signature = await signer.signMessage(
        typeof signableMessage === 'string' && signableMessage.startsWith('0x')
          ? ethers.getBytes(signableMessage)
          : signableMessage
      );
      await getVerifiedSigner(investmentOwner, investmentProvider);
      const created = await post('/glider/create', { ...signatureData, signature, portfolioName: 'BaseStock10' });
      await getVerifiedSigner(investmentOwner, investmentProvider);
      portfolioId = created.data.portfolioId;
      localStorage.setItem(portfolioStorageKey(connectedAddress), portfolioId);
    }
    button.textContent = 'Preparing USDC deposit…';
    investmentPortfolio = portfolioId;
    const instruction = await post('/glider/deposit', { portfolioId: investmentPortfolio, amount, userWalletAddress: investmentOwner });
    await getVerifiedSigner(investmentOwner, investmentProvider);
    const { destination, tokenAmount, tokenContractAddress: usdcAddress } = instruction.data;
    document.querySelector('#deposit-destination').textContent = `Destination: your Glider Base smart account ${destination.slice(0, 10)}…${destination.slice(-8)}`;
    const rawAmount = BigInt(tokenAmount);
    if (usdcAddress.toLowerCase() !== '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' || !ethers.isAddress(destination) || rawAmount !== ethers.parseUnits(amount, 6)) throw new Error('Deposit instructions do not match the requested Base USDC amount. Nothing was sent.');
    const usdc = new ethers.Contract(usdcAddress, [
      'function balanceOf(address) view returns (uint256)',
      'function transfer(address,uint256) returns (bool)'
    ], signer);
    const balance = await usdc.balanceOf(connectedAddress);
    if (balance < rawAmount) throw new Error('Your connected Base wallet does not have enough official Base USDC for this amount.');
    let fee = 'Estimate unavailable. Your wallet will show the network fee before approval.';
    try {
      const gas = await usdc.transfer.estimateGas(destination, rawAmount);
      const price = await signer.provider.getFeeData();
      const gasPrice = price.maxFeePerGas ?? price.gasPrice;
      if (gasPrice != null) fee = `Estimated execution gas: ${ethers.formatEther(gas * gasPrice)} ETH. Base L1 data fees may be additional; your wallet shows the final estimate.`;
    } catch { /* An unavailable estimate is not a zero fee. */ }
    if (!await reviewAction({ title: 'Review USDC deposit', amount: `${amount} USDC`, destination, source: investmentOwner, fee, note: 'This sends USDC to your Glider account. It does not mean stocks have been purchased. Wait for indexing, then request a rebalance.' })) return;
    await getVerifiedSigner(investmentOwner, investmentProvider);
    button.textContent = 'Confirm USDC transfer to Glider account…';
    const funding = await usdc.transfer(destination, rawAmount);
    fundingHash = funding.hash;
    saveActivity('Deposit', `${amount} USDC`, fundingHash, { owner: investmentOwner, portfolioId: investmentPortfolio, state: 'pending' });
    button.textContent = 'Confirming USDC transfer…';
    const receipt = await funding.wait();
    const tx = funding.hash;
    saveActivity('Deposit', `${amount} USDC`, tx, { owner: investmentOwner, portfolioId: investmentPortfolio, state: Number(receipt.status) === 1 ? 'confirmed' : 'failed' });
    button.textContent = 'Investment submitted ✓';
    document.querySelector('#rebalance-all').disabled = false;
    alert(`Your USDC was sent to your Glider Base account. It may take a short time to index before you can rebalance. Transaction: ${tx}`);
    setTimeout(loadWithdrawableAssets, 4000);
  } catch (error) {
    document.querySelector('#invest-usdc').disabled = false;
    document.querySelector('#invest-usdc').textContent = 'Invest USDC';
    const replacement = error.code === 'TRANSACTION_REPLACED' ? error.receipt : null;
    if (fundingHash) saveActivity('Deposit', `${amount} USDC`, fundingHash, { owner: investmentOwner, portfolioId: investmentPortfolio, state: replacement ? (error.cancelled ? 'cancelled' : (Number(replacement.status) === 1 ? 'confirmed' : 'failed')) : (error.receipt ? 'failed' : 'pending'), replacementHash: replacement?.hash });
    window.BaseStockSafety?.status(fundingHash ? 'Transfer was broadcast. Check Transaction history before sending again.' : 'Deposit stopped. No confirmed transfer is recorded.', 'error');
    alert(`${fundingHash ? 'A transfer was broadcast. Check its status before retrying.' : 'Investment was not completed:'} ${error.shortMessage || error.message || 'Unknown error'}`);
  } finally {
    walletActionBusy = false;
    document.querySelector('#invest-usdc').disabled = false;
    document.querySelector('#invest-usdc').textContent = 'Invest USDC';
  }
});
document.querySelector('#rebalance-all').addEventListener('click', async () => {
  if (!await connectWallet()) return;
  if (!connectedAddress) return;
  if (!portfolioId) return alert('No Glider portfolio exists for this wallet and strategy yet. Deposit USDC first.');
  const button = document.querySelector('#rebalance-all');
  const status = document.querySelector('#rebalance-status');
  if (walletActionBusy) return alert('Another action is in progress. Finish or cancel it first.');
  walletActionBusy = true;
  const rebalanceOwner = connectedAddress;
  const rebalanceProvider = activeProvider;
  const rebalancePortfolio = portfolioId;
  let requestSent = false;
  try {
    if (!await reviewAction({ title: 'Review rebalance request', amount: 'Follow the current strategy allocation', destination: `Glider portfolio ${rebalancePortfolio}`, source: rebalanceOwner, fee: 'Final swap, execution and network costs are not quoted for this request.', note: 'Glider may trade your assets under the permissions you previously authorized. Acceptance is not confirmation that swaps have completed.' })) return;
    await getVerifiedSigner(rebalanceOwner, rebalanceProvider);
    button.disabled = true;
    button.textContent = 'Requesting Glider rebalance…';
    status.textContent = 'Glider is checking your portfolio and preparing the strategy execution.';
    requestSent = true;
    const result = await post('/glider/rebalance', { portfolioId: rebalancePortfolio });
    saveActivity('Rebalance', 'Strategy execution requested', '', { owner: rebalanceOwner, portfolioId: rebalancePortfolio, operationId: result.data.operationId, state: 'accepted' });
    button.textContent = 'Glider rebalance requested ✓';
    status.textContent = `Glider accepted the rebalance request. Operation: ${result.data.operationId || 'processing'}.`;
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Ask Glider to rebalance';
    if (requestSent) saveActivity('Rebalance', 'Strategy execution request', '', { owner: rebalanceOwner, portfolioId: rebalancePortfolio, state: 'unknown', error: 'Submission response unavailable. Check with Glider before retrying.' });
    status.textContent = `Glider could not rebalance yet: ${error.message || 'Unknown error'}`;
    window.BaseStockSafety?.status(requestSent ? 'Rebalance submission could not be verified. Check history before retrying.' : 'Rebalance was not submitted.', 'error');
  } finally {
    walletActionBusy = false;
    button.disabled = !connectedAddress || !portfolioId;
    button.textContent = 'Ask Glider to rebalance';
  }
});

async function reviewAction(details) {
  if (!window.BaseStockSafety?.review) throw new Error('The transaction review panel has not loaded. Refresh before continuing.');
  return window.BaseStockSafety.review(details);
}
window.BaseStockRuntime = {
  snapshot: () => ({ owner: connectedAddress, portfolioId, positions: currentPositions, provider: activeProvider }),
  post,
  refresh: loadWithdrawableAssets,
  busy: () => walletActionBusy
};
