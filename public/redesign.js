// Local visual preview: transaction controls and their handlers remain intact.
(() => {
document.body.insertAdjacentHTML('afterbegin', `<div class="preview-bar"><span>DESIGN PREVIEW <b>Local only</b></span><div><a href="/original/index.html">Current design</a><a href="/" aria-current="page">New design ↗</a></div></div>`);
document.querySelector('.hero h1').innerHTML = 'Big companies.<br><em>One portfolio.</em>';
document.querySelector('.hero .eyebrow').textContent = 'ON BASE. IN YOUR CONTROL.';
document.querySelector('.hero .lede').textContent = 'Start with USDC. Build exposure to eight tokenized stocks through a single Glider portfolio, connected to your wallet.';
document.querySelector('.hero-notice').outerHTML = '<div class="hero-tags"><span>Base mainnet</span><span>From 25 USDC</span><span>Powered by Glider</span></div>';
document.querySelector('.hero-actions').innerHTML = '<a class="button" href="#deposit">Start your portfolio ↗</a><a class="text-link" href="#portfolio">Explore the basket →</a>';
document.querySelector('.hero .network').textContent = 'Your wallet. Your approvals. Your portfolio.';
document.querySelector('.hero-banner')?.remove();
document.querySelector('.hero-coming')?.remove();
document.querySelector('.nav nav').innerHTML = '<a href="#portfolio">Portfolio</a><a href="#deposit">Invest</a><a href="#leaderboard">Community</a><a href="#rewards">Rewards</a><a href="#faq">Help</a>';
document.querySelector('.balance-card .muted').insertAdjacentHTML('afterend', '<div class="portfolio-art" aria-hidden="true"><span>YOUR NEXT CHAPTER</span><div class="art-orbit"><i>↗</i></div><small>Built around the companies<br>shaping what’s next.</small></div>');
document.querySelector('.hero').insertAdjacentHTML('afterend', '<section class="shell platform-strip" aria-label="Platform overview"><div><span>01 / ACCESS</span><strong>One USDC deposit</strong><p>A simple starting point for your portfolio.</p></div><div><span>02 / OWNERSHIP</span><strong>Connected to your wallet</strong><p>You review and approve each transaction.</p></div><div><span>03 / VISIBILITY</span><strong>Holdings in one place</strong><p>Track value, assets, and available withdrawals.</p></div></section>');
document.querySelector('.trade-heading h2').textContent = 'Your portfolio starts here.';
document.querySelector('.trade-heading .eyebrow').textContent = 'MAKE YOUR NEXT MOVE';
document.querySelector('.trade-heading > p:last-child').textContent = 'Deposit USDC or withdraw an available asset. Connect your wallet to get started.';
document.querySelector('.rewards h2').innerHTML = 'A community.<br>With a share in the rewards.';
document.querySelector('.rewards .eyebrow').textContent = 'THE NEXT CHAPTER · COMING SOON';
document.querySelector('.how').remove();
document.querySelector('main').insertAdjacentHTML('beforeend', `<section class="shell faq" id="faq"><div><p class="eyebrow">A LITTLE CLARITY</p><h2>Before you begin.</h2><p>The essentials, in plain English.</p></div><div class="faq-items"><details open><summary>Where does my USDC go?</summary><p>Your deposit goes to the personal Base smart account provided by Glider for your wallet. You can review the address before approving the transfer.</p></details><details><summary>How do I withdraw?</summary><p>Connect your wallet, choose an available indexed asset, and enter the amount. MAX selects the full available balance of that asset. Review and approve the request in your wallet.</p></details><details><summary>Why eight stocks and ten reward stocks?</summary><p>The live strategy currently holds eight stocks. The ten-stock basket belongs to the proposed BaseStock reward program.</p></details><details><summary>Are rewards running now?</summary><p>The BaseStock token rewards are planned for a future launch. The advertised Coinbase boosted APR is a separate offer with its own eligibility and terms.</p></details><details><summary>What do I need to start?</summary><p>A supported wallet, at least 25 USDC on Base, and ETH on Base for network fees. Use Connect wallet to choose your wallet.</p></details></div></section>`);

// Reorganize existing elements, preserving all bound financial controls.
const main = document.querySelector('main');
const hero = document.querySelector('.hero');
const balanceCard = document.querySelector('.balance-card');
const actions = document.querySelector('.trade-actions');
const portfolio = document.querySelector('.portfolio');
const holdings = document.querySelector('.holdings-table-wrap');
const leaderboard = document.querySelector('.leaderboard');
const rewards = document.querySelector('.rewards');
const eligibility = document.querySelector('.reward-eligibility');
const rewardStocks = document.querySelector('.reward-stocks');
const faq = document.querySelector('.faq');
const intro = document.querySelector('.platform-strip');
document.querySelector('.nav nav').innerHTML = '<button data-page="overview">Overview</button><button data-page="invest">My portfolio</button><button data-page="rewards">Rewards <span>Soon</span></button><button data-page="community">Leaderboard</button>';
const panels = {};
for (const name of ['overview', 'invest', 'rewards', 'community']) {
  const panel = document.createElement('div');
  panel.className = 'page-view';
  panel.dataset.pageView = name;
  main.append(panel);
  panels[name] = panel;
}
panels.overview.append(hero, intro, portfolio, faq);
panels.invest.innerHTML = '<div class="shell workspace-heading"><div><p class="eyebrow">YOUR INVESTMENT WORKSPACE</p><h1>My portfolio<span>.</span></h1><p>Everything you own. Every move you make. In one place.</p></div><span class="network-pill"><i></i> Base mainnet</span></div><div class="shell investment-layout"><div class="account-column"></div><div class="transaction-column"></div></div><div class="shell positions-slot"></div>';
panels.invest.querySelector('.account-column').append(balanceCard);
panels.invest.querySelector('.transaction-column').append(actions);
panels.invest.querySelector('.positions-slot').append(holdings);
balanceCard.querySelector('.portfolio-art').remove();
panels.invest.querySelector('.account-column').insertAdjacentHTML('beforeend', '<aside class="account-guide"><span class="eyebrow">BEFORE YOU INVEST</span><h3>A simple checklist.</h3><p><b>01</b> Connect your wallet on Base</p><p><b>02</b> Have 25 USDC + ETH for gas</p><p><b>03</b> Review your deposit destination</p><small>Deposits and withdrawals require your wallet approval. Network fees apply.</small></aside>');
panels.rewards.innerHTML = '<div class="shell workspace-heading"><div><p class="eyebrow">THE BASESTOCK ECOSYSTEM</p><h1>More reasons to hold<span>.</span></h1><p>A proposed reward program for the community behind on-chain stocks.</p></div><span class="soon-pill">Coming soon</span></div>';
panels.rewards.append(rewards, eligibility, rewardStocks);
panels.community.innerHTML = '<div class="shell workspace-heading"><div><p class="eyebrow">BUILT AROUND PARTICIPATION</p><h1>The bigger picture<span>.</span></h1><p>Explore portfolio participation, current value, and share of strategy TVL.</p></div><span class="network-pill"><i></i> Glider indexed data</span></div>';
panels.community.append(leaderboard);
hero.querySelector('h1').innerHTML = 'The companies<br>you believe in.<br><em>Now on-chain.</em>';
hero.querySelector('.eyebrow').innerHTML = '<span class="tiny-base"></span> A NEW WAY TO OWN THE FUTURE';
hero.querySelector('.lede').textContent = 'One portfolio. Eight tokenized stocks. Invest with USDC on Base and manage your holdings from your own wallet.';
hero.querySelector('.asset-flow').remove();
hero.querySelector('.hero-tags').remove();
hero.querySelector('.hero-actions').innerHTML = '<a class="button" href="#deposit">Start investing <span>↗</span></a><a class="text-link" href="#portfolio">Explore the strategy <span>↓</span></a>';
hero.querySelector('.network').textContent = 'Start from 25 USDC · Powered by Glider';
const brands = [['nvidia.com','NVIDIA','NVDA'],['apple.com','Apple','AAPL'],['google.com','Alphabet','GOOGL'],['microsoft.com','Microsoft','MSFT'],['amazon.com','Amazon','AMZN'],['meta.com','Meta','META'],['tesla.com','Tesla','TSLA'],['spacex.com','SpaceX','SPCX']];
hero.insertAdjacentHTML('beforeend', `<div class="market-art" aria-label="Illustration of tokenized stock access; not a performance chart"><div class="art-heading"><span>GLOBAL COMPANIES. BASE RAILS.</span><span>↗</span></div><div class="company-mosaic">${brands.map(([domain,name,ticker],i)=>`<div class="company-tile tile-${i}"><img src="https://www.google.com/s2/favicons?domain=${domain}&sz=128" alt=""/><span>${name}</span><small>${ticker}</small></div>`).join('')}</div><div class="art-caption"><span class="base-symbol">−</span><div><strong>A familiar world. A new way in.</strong><small>Tokenized equities on Base</small></div><span>↗</span></div></div>`);
intro.innerHTML = '<div><span>THE STARTING POINT</span><strong>25 <small>USDC</small></strong><p>Minimum investment</p></div><div><span>THE CURRENT BASKET</span><strong>8 <small>stocks</small></strong><p>One Glider portfolio</p></div><div><span>THE NETWORK</span><strong>Base <small>mainnet</small></strong><p>Wallet-approved transactions</p></div><div><span>THE CONTROL</span><strong>You <small>decide</small></strong><p>Deposit, track, and withdraw</p></div>';
portfolio.insertAdjacentHTML('beforebegin','<section class="shell editorial"><p class="eyebrow">INVESTING, WITHOUT THE CLUTTER</p><h2>A single place for<br><span>your next investment.</span></h2><div class="editorial-grid"><article><span class="feature-icon">↗</span><h3>Start with what you know.</h3><p>Discover a basket of recognizable companies, represented by tokens on Base.</p><a href="#portfolio">Meet the portfolio →</a></article><article><span class="feature-icon">⊞</span><h3>See the whole picture.</h3><p>Track your indexed holdings, token balances, and portfolio value in a dedicated workspace.</p><a href="#holdings">Open your dashboard →</a></article><article><span class="feature-icon">◎</span><h3>Stay in the driver’s seat.</h3><p>Approve transactions from your wallet. Choose an available asset and the amount to withdraw.</p><a href="#withdraw">Manage your holdings →</a></article></div></section>');
document.querySelector('.strategy-heading .eyebrow').textContent = 'MEET THE STRATEGY';
document.querySelector('.trade-heading h2').textContent = 'Move your money.';
document.querySelector('.trade-heading .eyebrow').textContent = 'DEPOSIT & WITHDRAW';
document.querySelector('.trade-heading > p:last-child').textContent = 'Choose your action. Review it in your wallet.';
document.querySelector('.rewards h2').innerHTML = 'Hold a stake.<br>Share in what’s next.';
faq.insertAdjacentHTML('beforebegin','<section class="shell rewards-teaser"><div><span class="soon-pill">On the horizon</span><h2>A community worth<br>being part of.</h2><p>Explore the proposed BaseStock reward program: 80% for token holders and 20% for stock investors.</p><a class="button" href="#rewards">Discover the reward plan ↗</a></div><div class="reward-preview"><div><strong>80<span>%</span></strong><small>Token holders</small></div><div><strong>20<span>%</span></strong><small>Stock investors</small></div><p>Proposed split · Not live yet</p></div></section>');
document.querySelector('footer').insertAdjacentHTML('afterbegin','<div class="footer-statement">The next chapter<br>of stock ownership.</div>');
const routeMap = {deposit:'invest',withdraw:'invest',holdings:'invest',portfolio:'overview',rewards:'rewards','reward-stocks':'rewards',leaderboard:'community',faq:'overview',top:'overview'};
function showPage(name, target, scroll = true) {
  for (const [key,panel] of Object.entries(panels)) panel.hidden = key !== name;
  document.querySelectorAll('[data-page]').forEach(button => {
    if (button.dataset.page === name) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
  if (scroll) {
    const node = target ? document.getElementById(target) : null;
    if (node?.closest('details')) node.closest('details').open = true;
    if (node && node.closest('.page-view') === panels[name]) node.scrollIntoView({behavior:'instant',block:'start'});
    else window.scrollTo({top:0,behavior:'instant'});
  }
}
document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
  history.pushState(null,'',`#view-${button.dataset.page}`);
  showPage(button.dataset.page);
}));
function routeHash() {
  const hash = location.hash.slice(1);
  const page = hash.startsWith('view-') ? hash.slice(5) : routeMap[hash];
  showPage(panels[page] ? page : 'overview', hash);
}
window.addEventListener('hashchange',routeHash);
window.addEventListener('popstate',routeHash);
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = link.getAttribute('href').slice(1);
  if (routeMap[target]) {
    event.preventDefault();
    history.pushState(null,'',`#${target}`);
    showPage(routeMap[target],target);
  }
});
hero.querySelector('h1').innerHTML = 'Hold the stocks.<br><em>Unlock 10% APR.</em>';
hero.querySelector('.eyebrow').innerHTML = '<span class="tiny-base"></span> BITWISE MAG7X · COINBASE BOOSTED APR';
hero.querySelector('.lede').textContent = 'Invest in the Bitwise Mag7x strategy on Base. Eligible stock portfolios can earn a 10% annualized USDC incentive during the reward campaign.';
hero.querySelector('.network').innerHTML = 'Campaign eligibility from $300 · Ends October 23, 2026<br>Incentive APR, not stock performance. Terms apply.';
hero.querySelector('.market-art').insertAdjacentHTML('afterbegin','<div class="apr-highlight"><div><span>BITWISE MAG7X STRATEGY</span><strong>10<small>%</small></strong></div><div><b>Boosted APR</b><p>USDC incentives for<br>eligible stock holdings</p><a href="https://app.merkl.xyz/opportunities/17719428838006984214" target="_blank" rel="noreferrer">Campaign details ↗</a></div></div>');
hero.querySelector('.art-heading').remove();
intro.firstElementChild.innerHTML = '<span>THE CAMPAIGN INCENTIVE</span><strong>10<small>% APR</small></strong><p>For eligible holdings · Limited time</p>';
portfolio.insertAdjacentHTML('afterbegin','<div class="campaign-strip"><span class="campaign-rate">10% <small>APR</small></span><div><strong>Bitwise Mag7x holding incentive</strong><p>USDC rewards on eligible portfolios from $300, capped at $50,000. Campaign: August 24–October 23, 2026. Stock prices can rise or fall.</p></div><a href="https://app.merkl.xyz/opportunities/17719428838006984214" target="_blank" rel="noreferrer">View terms ↗</a></div>');
document.querySelector('.deposit-panel .minimum').insertAdjacentHTML('afterend','<p class="campaign-deposit-note">10% APR campaign: a portfolio of at least $300 is required for reward eligibility. A 25 USDC deposit alone does not qualify. <a href="https://app.merkl.xyz/opportunities/17719428838006984214" target="_blank" rel="noreferrer">Terms ↗</a></p>');
faq.querySelector('.faq-items').insertAdjacentHTML('afterbegin','<details><summary>How does the 10% APR work?</summary><p>It is a time-limited USDC incentive for eligible Bitwise Mag7x stock portfolios—not a promised stock return. The published campaign runs August 24–October 23, 2026, with a $300 minimum eligible portfolio and rewards capped at $50,000. The 10% rate is annualized, not a 10% payout over the campaign. <a href="https://app.merkl.xyz/opportunities/17719428838006984214" target="_blank" rel="noreferrer">Read the campaign terms ↗</a></p></details>');
// Plain-language copy, without changing transaction behavior or eligibility.
hero.querySelector('h1').innerHTML = 'Invest in stocks.<br><em>Earn 10% APR.</em>';
hero.querySelector('.lede').textContent = 'Build an eight-stock portfolio with Bitwise Mag7x on Base. Eligible holdings earn USDC rewards through the limited-time 10% APR campaign.';
panels.invest.querySelector('.workspace-heading p:last-child').textContent = 'Track your holdings, add USDC, or withdraw to your wallet.';
document.querySelector('.trade-heading h2').textContent = 'Manage your investment';
document.querySelector('.trade-heading > p:last-child').textContent = 'Add USDC to your portfolio or choose an asset to withdraw.';
document.querySelector('.deposit-panel .action-label').textContent = 'Add to your portfolio';
document.querySelector('.withdraw-panel .action-label').textContent = 'Withdraw to your wallet';
document.querySelector('label[for="withdraw-asset"]').textContent = 'CHOOSE AN ASSET';
document.querySelector('label[for="withdraw-amount"]').textContent = 'AMOUNT TO WITHDRAW';
document.querySelector('.deposit-panel .notice').innerHTML = 'Your first deposit sets up a personal Glider account for this <a class="strategy-link" href="https://glider.fi/strategy/01KZY1G56YFYWKS8AH0PR1YMQX" target="_blank" rel="noreferrer">strategy</a>. Future deposits go to the same account.';
document.querySelector('.editorial .eyebrow').textContent = 'ONE PORTFOLIO. CLEAR CONTROL.';
document.querySelector('.editorial h2').innerHTML = 'Invest, track, and manage.<br><span>All in one place.</span>';
document.querySelector('.rewards-teaser h2').innerHTML = 'Rewards for the<br>BaseStock community.';
document.querySelector('.rewards h2').innerHTML = 'Two ways to take part.<br>One reward program.';
panels.rewards.querySelector('.workspace-heading h1').innerHTML = 'The BaseStock reward plan<span>.</span>';
panels.community.querySelector('.workspace-heading h1').innerHTML = 'The strategy community<span>.</span>';
document.querySelector('.faq h2').textContent = 'Your questions, answered.';
document.querySelector('.faq .eyebrow').textContent = 'GOOD TO KNOW';
document.querySelector('.eligibility-cards article:last-child p').textContent = 'The proposed plan would convert available USDC rewards into the eight-stock portfolio through daily rebalancing.';

document.querySelector('[data-page="rewards"]').innerHTML = 'BaseStock Token <span>Soon</span>';
panels.rewards.querySelector('.workspace-heading h1').innerHTML = 'BaseStock Token<span>.</span>';
panels.rewards.querySelector('.workspace-heading p:last-child').textContent = 'A planned token on Base that shares fee revenue with its community.';
document.querySelector('.rewards .eyebrow').textContent = 'THE PLAN · A 1% FEE FOR COMMUNITY REWARDS';
document.querySelector('.rewards h2').innerHTML = 'One fee.<br>Two ways to earn rewards.';
document.querySelector('.rewards-copy > p:not(.eyebrow)').innerHTML = 'Under the proposed plan, BaseStock would receive a <b>1% fee</b> and distribute that fee revenue between <b>$BaseStock token holders</b> and <b>people invested in the stock portfolio</b>. This is fee revenue—not 1% of the token supply.';
document.querySelector('.rewards .plan-note').textContent = 'Coming soon. The token and this reward program are not live. Fee mechanics and final eligibility rules will be published before launch.';
const splitRows = document.querySelectorAll('.split-card > div');
splitRows[0].innerHTML = '<span>80%</span><small>of the reward pool for eligible $BaseStock token holders</small>';
splitRows[1].innerHTML = '<span>20%</span><small>of the reward pool for eligible stock-portfolio investors</small>';
document.querySelector('.split-card > p').textContent = 'Example: if the reward pool receives $100 in fees, $80 goes to the token-holder pool and $20 to the stock-investor pool. These are pool allocations, not returns on your investment.';
document.querySelector('.eligibility-intro .eyebrow').textContent = 'HOW DAILY REWARDS WOULD WORK';
document.querySelector('#eligibility-title').textContent = 'Hold. Qualify. Receive rewards.';
document.querySelector('.eligibility-intro > p:last-child').textContent = 'A snapshot is a record of what you hold at a particular moment. Here is how we plan to check eligibility.';
document.querySelector('.eligibility-cards').innerHTML = '<article><span class="eligibility-number">Token holders</span><h3>Hold $BaseStock for 3 of 4 daily checks.</h3><p>We plan to take four snapshots at random times each day. Hold $BaseStock during at least three of them to qualify for a share of the token-holder reward pool.</p><small>Rewards are planned as ten stock tokens sent to eligible wallets every 24 hours. Final holding thresholds and allocation rules will be published before launch.</small></article><article><span class="eligibility-number">Stock investors</span><h3>Hold portfolio stocks at the daily check.</h3><p>We plan to take one snapshot at a random time each day. Eligible investors holding stocks in their portfolio at that moment can qualify for a share of the stock-investor reward pool.</p><small>This pool pays USDC rewards. Final portfolio limits and allocation rules will be published before launch.</small></article><article><span class="eligibility-number">Your portfolio</span><h3>Put your USDC rewards back to work.</h3><p>The proposed daily rebalance would use available USDC rewards to buy the eight stocks in the Bitwise Mag7x strategy, subject to the permissions you approve.</p><small>The separate 10% APR incentive has its own campaign dates and eligibility requirements. It is not part of the BaseStock fee split.</small></article>';
eligibility.insertAdjacentHTML('afterend', '<section class="shell key-explainer"><div><p class="eyebrow">YOUR WALLET. YOUR PRIVATE KEYS.</p><h2>We do not hold your wallet’s private keys.</h2></div><div><p>BaseStock does not ask for your seed phrase or wallet private key. You connect your wallet and approve the permissions and transactions needed to use Glider.</p><p>Your portfolio uses a Glider smart account. Automated trading can act under permissions you authorize, so review those permissions carefully before signing.</p><small>Never share your seed phrase or private key with anyone claiming to be BaseStock support.</small></div></section>');
document.querySelector('.rewards-teaser p').textContent = 'The proposed 1% fee funds two reward pools: 80% for eligible token holders and 20% for eligible stock investors.';
document.querySelector('.rewards-teaser .button').textContent = 'Explore BaseStock Token ↗';

const themeButton = document.createElement('button');
const topSocial = document.createElement('a');
topSocial.className = 'top-social';
topSocial.href = 'https://x.com/BaseStock10';
topSocial.target = '_blank';
topSocial.rel = 'noopener noreferrer';
topSocial.setAttribute('aria-label', 'BaseStock10 on X (opens in a new tab)');
topSocial.title = 'Follow BaseStock10 on X';
topSocial.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.039L6.487 3.24H4.3z"/></svg>';
document.querySelector('.nav > .wallet-button').before(topSocial);
// Keep the public-facing experience focused.
document.querySelector('.preview-bar').remove();
document.querySelector('.editorial').remove();
document.querySelector('.platform-strip').remove();
document.querySelector('.art-caption').remove();
document.querySelector('.account-guide').remove();
document.querySelector('.afterbook-card').remove();
document.querySelector('.strategy-snapshot > p:not(.strategy-notice)').textContent = 'One Glider portfolio, allocated across eight tokenized stocks. Review the allocation below, then manage deposits and withdrawals in My portfolio.';
document.querySelector('.strategy-notice').textContent = 'The basket may expand as more stocks become available on Base. Incentive eligibility and campaign terms apply.';
document.querySelector('.campaign-strip').remove();
document.querySelector('.strategy-heading').insertAdjacentHTML('beforeend','<a class="text-link research-link" href="https://afterbook.app/" target="_blank" rel="noreferrer">After-hours prices ↗</a>');
hero.querySelector('h1').innerHTML = 'Stock investing.<br><em>Built for on-chain.</em>';
hero.querySelector('.lede').textContent = 'Invest in eight leading companies through Bitwise Mag7x. Eligible portfolios can earn a 10% annualized USDC incentive on Base.';
document.querySelector('.hero-actions .button').innerHTML = 'Open your portfolio <span>↗</span>';
document.querySelector('.rewards-teaser h2').innerHTML = 'Introducing<br>BaseStock Token.';
document.querySelector('.rewards-teaser .soon-pill').textContent = 'COMING SOON';
document.querySelector('.reward-preview').remove();
document.querySelector('.rewards-teaser').classList.add('compact-teaser');
document.querySelectorAll('.faq details').forEach(item => item.open = false);
document.querySelector('.faq > div > p:last-child').textContent = 'What to know before you invest.';
document.querySelector('.eligibility-intro > p:last-child').textContent = 'A snapshot records your holdings at a moment in time. The proposed daily checks determine who qualifies.';
document.querySelector('.eligibility-cards article:last-child').remove();
const rewardDetails = document.createElement('details');
rewardDetails.className = 'shell basket-disclosure';
rewardDetails.innerHTML = '<summary>Explore the 10-stock reward basket <span>+</span></summary>';
rewardStocks.before(rewardDetails);
rewardDetails.append(rewardStocks);
document.querySelector('.reward-stocks-link').addEventListener('click', () => { rewardDetails.open = true; });
document.querySelector('footer').innerHTML = '<div class="footer-brand"><strong>BaseStock10</strong><p>Tokenized stock portfolios on Base.</p></div><div class="footer-links"><a href="#faq">Help</a><a href="https://x.com/BaseStock10" target="_blank" rel="noreferrer">𝕏 Community</a></div><div class="footer-legal">Base mainnet · Not investment advice. Tokenized stocks involve market and smart-contract risk. BaseStock token rewards are not live.</div>';
themeButton.type = 'button';
themeButton.className = 'theme-toggle';
document.querySelector('.nav > .wallet-button').before(themeButton);
function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span><span>${dark ? 'Light' : 'Dark'}</span>`;
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
  themeButton.setAttribute('aria-pressed', String(dark));
}
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('bs10-theme', theme); } catch (_) {}
  updateThemeButton();
});
updateThemeButton();
// Discovery tools are read-only and do not affect the strategy or asset balances.
const stockGrid = document.querySelector('#allocation-grid');
stockGrid.insertAdjacentHTML('beforebegin', '<div class="stock-toolbar"><div><h3>Inside the portfolio</h3><p>Target allocations supplied by Glider</p></div><label class="stock-search"><span aria-hidden="true">⌕</span><input type="search" id="stock-search" placeholder="Find a company or ticker" aria-label="Find a company or ticker" autocomplete="off" /></label></div>');
stockGrid.insertAdjacentHTML('afterend', '<p class="stock-search-empty" hidden>No matching stocks. Try a company name or ticker.</p>');
const stockSearch = document.querySelector('#stock-search');
function filterStocks() {
  const query = stockSearch.value.trim().toLowerCase();
  let visible = 0;
  for (const card of stockGrid.children) {
    card.hidden = !card.textContent.toLowerCase().includes(query);
    if (!card.hidden) visible++;
  }
  document.querySelector('.stock-search-empty').hidden = visible !== 0;
}
stockSearch.addEventListener('input', filterStocks);
new MutationObserver(filterStocks).observe(stockGrid, {childList:true});
const splitVisual = document.createElement('div');
splitVisual.className = 'reward-split-visual';
splitVisual.innerHTML = '<div class="split-visual-labels"><span><i></i> Token holders · 80%</span><span><i></i> Stock investors · 20%</span></div><div class="split-visual-track" role="img" aria-label="Proposed reward pool: 80 percent to token holders, 20 percent to stock investors"><span></span><span></span></div><p>Two reward pools. One proposed 1% fee.</p>';
document.querySelector('.rewards-copy').append(splitVisual);
document.querySelector('.transaction-column').insertAdjacentHTML('beforeend', '<details class="funding-guide"><summary>New here? How investing works <span>+</span></summary><ol><li><b>Connect on Base.</b> Keep USDC for your deposit and ETH for network fees in your wallet.</li><li><b>Check the destination.</b> Your USDC goes to your personal Glider smart account.</li><li><b>Wait for indexing.</b> Once the deposit appears, request a rebalance to follow the stock basket.</li></ol><p>The 25 USDC deposit minimum and $300 campaign-eligibility threshold are different.</p></details>');
document.querySelector('.brand').setAttribute('aria-label','BaseStock10 home');
document.querySelector('.nav nav').setAttribute('aria-label','Main navigation');
document.querySelector('.nav > .wallet-button').classList.add('primary-connect');
hero.querySelector('.network').classList.add('campaign-caption');
document.querySelector('.stock-search-empty').setAttribute('role','status');
// Decorative 3D response on the stock showcase only; no financial controls move.
document.querySelector('[data-page="rewards"]').innerHTML = 'BaseStock10 Token';
panels.rewards.querySelector('.workspace-heading h1').textContent = 'BaseStock10 Token';
panels.rewards.querySelector('.workspace-heading .eyebrow').textContent = 'COMING SOON ON BASE';
panels.rewards.querySelector('.workspace-heading p:last-child').textContent = 'A planned token that shares fee revenue with token holders and stock investors.';
document.querySelector('.rewards .eyebrow').textContent = 'HOW THE REWARDS WILL WORK';
document.querySelector('.rewards h2').innerHTML = 'We receive a 1% fee.<br>We share it with you.';
document.querySelector('.rewards-copy > p:not(.eyebrow)').innerHTML = 'Our plan is to receive a <b>1% fee</b> and put that fee revenue into a reward pool. The pool is shared between people who hold <b>$BaseStock</b> and people who invest in the <b>stock portfolio</b>.';
document.querySelector('.rewards .plan-note').textContent = 'This is the plan, not a live reward program. Final fee and eligibility rules will be published before launch.';
splitRows[0].innerHTML = '<span>80%</span><small>of the reward pool goes to eligible $BaseStock holders.</small>';
splitRows[1].innerHTML = '<span>20%</span><small>of the reward pool goes to eligible stock investors.</small>';
document.querySelector('.split-card > p').textContent = 'For example: $100 in fee revenue means $80 for the token-holder pool and $20 for the stock-investor pool. Your share depends on the final eligibility and distribution rules.';
document.querySelector('#eligibility-title').textContent = 'Two ways to qualify';
document.querySelector('.eligibility-intro .eyebrow').textContent = 'THE DAILY CHECKS';
document.querySelector('.eligibility-intro > p:last-child').textContent = 'A snapshot is a check of what is in your wallet or portfolio at a particular time.';
const simpleRewardCards = document.querySelectorAll('.eligibility-cards article');
simpleRewardCards[0].querySelector('h3').textContent = 'Hold $BaseStock at 3 of 4 checks.';
simpleRewardCards[0].querySelector('p').textContent = 'We plan to check token holdings four times a day, at random times. Hold $BaseStock during at least three checks to qualify for token-holder rewards.';
simpleRewardCards[0].querySelector('small').textContent = 'Eligible holders would receive rewards in 10 stock tokens, sent to their wallets every 24 hours. Minimum holdings and other rules will be announced before launch.';
simpleRewardCards[1].querySelector('h3').textContent = 'Hold stocks when we check.';
simpleRewardCards[1].querySelector('p').textContent = 'We plan to check stock portfolios once a day, at a random time. Hold portfolio stocks at that check to be considered for stock-investor rewards.';
simpleRewardCards[1].querySelector('small').textContent = 'These rewards would be paid in USDC. Portfolio limits and other eligibility rules will be announced before launch.';
document.querySelector('.key-explainer h2').textContent = 'Your private keys stay with you.';
document.querySelector('.key-explainer > div:last-child > p:first-child').textContent = 'We never ask for your seed phrase or wallet private key. You connect your wallet and approve the transactions and permissions needed to use Glider.';
document.querySelector('.rewards-teaser h2').innerHTML = 'Introducing<br>BaseStock10 Token.';
document.querySelector('.rewards-teaser .button').textContent = 'Explore BaseStock10 Token ↗';
const depositForm = document.querySelector('.deposit-panel');
const withdrawalForm = document.querySelector('.withdraw-panel');
document.querySelector('.trade-heading .eyebrow').remove();
document.querySelector('.trade-heading h2').textContent = 'Deposit & withdraw';
document.querySelector('.trade-heading > p:last-child').textContent = 'Your portfolio. Your next move.';
depositForm.querySelector('.action-label').outerHTML = '<div class="transaction-title"><span class="transaction-icon" aria-hidden="true">↙</span><div><h3>Deposit</h3><p>Add USDC to your portfolio</p></div><span class="transaction-network">Base</span></div>';
withdrawalForm.querySelector('.action-label').outerHTML = '<div class="transaction-title"><span class="transaction-icon out" aria-hidden="true">↗</span><div><h3>Withdraw</h3><p>Send an asset to your wallet</p></div><span class="transaction-network">Base</span></div>';
depositForm.querySelector('label').insertAdjacentHTML('beforebegin', '<div class="deposit-asset"><span class="field-caption">ASSET</span><div><img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040" alt=""/><span><b>USDC</b><small>USD Coin</small></span><span class="asset-network-label">On Base</span></div></div>');
const depositDetails = document.createElement('details');
depositDetails.className = 'transaction-details';
depositDetails.innerHTML = '<summary>Deposit details & reward eligibility <span>+</span></summary>';
depositDetails.append(depositForm.querySelector('.notice'), depositForm.querySelector('.campaign-deposit-note'));
depositForm.querySelector('#invest-usdc').before(depositDetails);
const destination = document.querySelector('#deposit-destination');
destination.classList.add('destination-note');
destination.textContent = 'Your Glider account address will be shown before you send USDC.';
depositDetails.before(destination);
const rewardMinimum = document.createElement('p');
rewardMinimum.className = 'reward-minimum';
rewardMinimum.textContent = '10% APR campaign: eligible portfolios from $300.';
depositForm.querySelector('.minimum').after(rewardMinimum);
const rebalanceStrip = document.createElement('div');
rebalanceStrip.className = 'rebalance-strip';
rebalanceStrip.innerHTML = '<div><h3>Keep your portfolio in balance</h3></div>';
rebalanceStrip.firstElementChild.append(document.querySelector('#rebalance-status'));
rebalanceStrip.append(document.querySelector('#rebalance-all'));
document.querySelector('.action-panels').after(rebalanceStrip);
const withdrawalDetails = document.createElement('details');
withdrawalDetails.className = 'transaction-details';
withdrawalDetails.innerHTML = '<summary>How withdrawals work <span>+</span></summary><p>Choose an available asset and enter its token amount. MAX selects that asset’s full available balance. Review the request in your wallet.</p>';
withdrawalDetails.append(document.querySelector('#withdraw-hint'));
withdrawalForm.querySelector('#withdraw-submit').before(withdrawalDetails);
for (const id of ['amount', 'withdraw-amount']) {
  const field = document.getElementById(id);
  field.placeholder = '0.00';
  field.inputMode = 'decimal';
}
// Preserve a short visual placeholder when the existing asset picker refreshes.
const withdrawalInput = document.querySelector('#withdraw-amount');
new MutationObserver(() => {
  if (withdrawalInput.placeholder !== '0.00') withdrawalInput.placeholder = '0.00';
}).observe(withdrawalInput, {attributes:true,attributeFilter:['placeholder']});
for (const [panel,id] of [[depositForm,'invest-usdc'],[withdrawalForm,'withdraw-submit']]) {
  const footer = document.createElement('div');
  footer.className = 'transaction-footer';
  footer.append(document.getElementById(id));
  footer.insertAdjacentHTML('beforeend','<small>You review and approve in your wallet.</small>');
  panel.append(footer);
}

const flexibleCard = hero.querySelector('.market-art');
const tiltPreference = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let tiltFrame = 0;
function resetCardTilt() {
  cancelAnimationFrame(tiltFrame);
  flexibleCard.style.removeProperty('--tilt-x');
  flexibleCard.style.removeProperty('--tilt-y');
  flexibleCard.classList.remove('is-tilting');
}
flexibleCard.addEventListener('pointermove', event => {
  if (!tiltPreference.matches || event.pointerType === 'touch') return;
  const bounds = flexibleCard.getBoundingClientRect();
  const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
  cancelAnimationFrame(tiltFrame);
  tiltFrame = requestAnimationFrame(() => {
    flexibleCard.style.setProperty('--tilt-x', `${-y * 5}deg`);
    flexibleCard.style.setProperty('--tilt-y', `${x * 6}deg`);
    flexibleCard.classList.add('is-tilting');
  });
});
flexibleCard.addEventListener('pointerleave', resetCardTilt);
flexibleCard.addEventListener('pointercancel', resetCardTilt);
window.addEventListener('blur', resetCardTilt);
tiltPreference.addEventListener('change', resetCardTilt);
routeHash();
})();
