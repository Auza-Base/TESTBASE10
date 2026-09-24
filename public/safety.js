(() => {
  const core = window.BaseStockSafetyCore;
  const runtime = window.BaseStockRuntime;
  const esc = core.escape;
  const snapshot = () => runtime.snapshot();
  const key = owner => `baseStock10Activity:${owner.toLowerCase()}`;
  const sessionRows = new Map();
  let refreshGeneration = 0, refreshing = false, pollCount = 0, pollTimer, cancelReview;
  const normalize = row => ({...row, operationId: row.operationId || (!core.txUrl(row.hash) && row.hash ? row.hash : undefined), state: row.state || 'unverified'});
  function rowsFor(owner) {
    if (!owner) return [];
    return (sessionRows.get(owner.toLowerCase()) || core.read(localStorage, key(owner))).map(normalize);
  }
  function persist(owner, rows) {
    sessionRows.set(owner.toLowerCase(), rows.slice(0,100));
    try { localStorage.setItem(key(owner), JSON.stringify(rows.slice(0,100))); }
    catch { status('Browser storage is unavailable. Activity is only saved for this tab session.', 'warning'); }
  }
  document.querySelector('.transaction-column').insertAdjacentHTML('afterbegin','<div id="transaction-progress" class="transaction-progress" role="status" aria-live="polite" hidden></div>');
  document.querySelector('.positions-slot').insertAdjacentHTML('beforeend', '<section class="transaction-history" aria-labelledby="history-title"><div class="safety-heading"><div><p class="eyebrow">FOLLOW YOUR FUNDS</p><h2 id="history-title">Transaction history</h2></div><button class="ghost" id="refresh-activity" type="button">Refresh status</button></div><p class="safety-muted">Actions recorded in this browser for the connected wallet. This is not a complete on-chain history. A rebalance entry is an operation, not a list of individual swaps.</p><div id="activity-rows" aria-live="polite"></div><p id="activity-note" class="safety-muted"></p></section>');
  document.querySelector('.account-column').insertAdjacentHTML('beforeend','<section class="eligibility-check"><p class="eyebrow">10% APR CAMPAIGN</p><h3 id="eligibility-check-title">Connect to check</h3><p id="eligibility-check-detail"></p><p class="safety-muted">Indicative balance check only. Published campaign: Aug 24–Oct 23, 2026. Rates, dates, and eligibility must be confirmed with the provider.</p><a href="https://app.merkl.xyz/opportunities/17719428838006984214" target="_blank" rel="noopener noreferrer">Check official eligibility ↗</a><hr><b>BaseStock10 token rewards</b><p class="safety-muted">Coming soon. No token reward eligibility or claim is available here.</p></section>');
  document.querySelector('.faq-items').insertAdjacentHTML('beforeend', '<details id="help-risks"><summary>What are the risks and fees?</summary><p>Token prices can fall, and liquidity may be limited. Tokenized stocks also depend on their issuer, custody arrangements, redemption rules, and smart contracts. These risks are separate from stock-market performance.</p><p>ETH network fees, execution or swap fees, slippage, and provider fees may apply. The review panel shows available estimates and identifies missing quotes; unavailable does not mean free. The proposed BaseStock 1% fee is not a quoted fee for investing in this strategy.</p><p>The 10% APR is a limited-time incentive, not a guaranteed stock return. Eligibility and regional restrictions apply. Read the <a href="https://glider.fi/strategy/01KZY1G56YFYWKS8AH0PR1YMQX" target="_blank" rel="noopener noreferrer">strategy details ↗</a> and <a href="https://app.merkl.xyz/opportunities/17719428838006984214" target="_blank" rel="noopener noreferrer">campaign terms ↗</a>.</p></details><details><summary>My transaction is pending. What should I do?</summary><p>Check Transaction history and use Refresh status. A confirmed USDC transfer may still need indexing before the portfolio updates. A withdrawal or rebalance marked accepted is not completed yet.</p><p>If a request times out after submission, do not send it again until you check its status. Use BaseScan for a known transaction hash, or contact Glider with the operation ID. History does not automatically retry any transfers.</p></details><details><summary>What permissions does Glider receive?</summary><p>Your wallet private keys stay with you. Enrollment can grant a session key or trading agent permission to act for your smart account. Review the scope and expiry in your wallet before signing; not every automated trade requires a new wallet prompt.</p><p>Manage or revoke permissions through your wallet or Glider’s supported controls. Never share your seed phrase or private key. Disconnecting this website alone may not revoke previously granted permissions.</p><a href="https://docs.glider.fi/" target="_blank" rel="noopener noreferrer">Glider documentation ↗</a></details>');
  document.querySelector('.footer-links').insertAdjacentHTML('beforeend','<a href="#faq">Fees & risks</a>');
  document.body.insertAdjacentHTML('beforeend','<dialog id="transaction-review" class="transaction-review" aria-labelledby="review-title"><div class="safety-heading"><p class="eyebrow">REVIEW BEFORE CONTINUING</p><button id="review-close" class="ghost" aria-label="Cancel transaction review" type="button">×</button></div><h2 id="review-title"></h2><dl id="review-fields"></dl><p id="review-note"></p><div class="review-actions"><button id="review-cancel" class="ghost" type="button">Cancel</button><button id="review-confirm" class="button" type="button">Continue</button></div><small>Continuing does not replace your wallet approval. Never sign an unexpected amount or recipient.</small></dialog>');
  const dialog = document.querySelector('#transaction-review');
  function status(message, state='pending') {
    const node = document.querySelector('#transaction-progress');
    node.hidden = !message;
    node.dataset.state = state;
    node.textContent = message;
  }
  function renderEligibility() {
    const {owner,positions} = snapshot();
    const [title, detail] = core.eligibility(positions?.totalValueUsd, !!owner);
    document.querySelector('#eligibility-check-title').textContent = title;
    document.querySelector('#eligibility-check-detail').textContent = detail;
  }
  function render() {
    const {owner} = snapshot();
    const target = document.querySelector('#activity-rows');
    const rows = rowsFor(owner);
    document.querySelector('#refresh-activity').disabled = !owner || refreshing;
    if (!owner) { target.textContent = 'Connect your wallet to view its recorded activity.'; return; }
    if (!rows.length) { target.textContent = 'No activity recorded in this browser for this wallet yet.'; return; }
    target.innerHTML = rows.map(row => {
      const tx = core.txUrl(row.replacementHash || row.hash);
      const at = Number(row.at);
      return `<article class="history-row"><div><strong>${esc(row.type)}</strong><p>${esc(row.detail)}</p><small>${Number.isFinite(at) ? esc(new Date(at).toLocaleString()) : 'Time unavailable'}</small></div><div><span class="history-state">${esc(row.state || 'unverified')}</span>${tx ? `<a href="${tx}" target="_blank" rel="noopener noreferrer">View on BaseScan ↗</a>` : ''}${row.operationId ? `<small class="operation-reference">Operation: ${esc(row.operationId)}</small>` : ''}${row.error ? `<small>${esc(row.error)}</small>` : ''}</div></article>`;
    }).join('');
  }
  function record(row) {
    if (!row.owner) return;
    const owner = row.owner;
    const rows = rowsFor(owner);
    const match = rows.findIndex(item => (row.hash && item.hash === row.hash) || (row.operationId && item.operationId === row.operationId));
    if (match >= 0) rows[match] = {...rows[match], ...row};
    else rows.unshift({...row, at:Date.now()});
    persist(owner, rows);
    if (snapshot().owner?.toLowerCase() === owner.toLowerCase()) {
      render(); status(`${row.type}: ${row.state}. See Transaction history for details.`, row.state === 'failed' ? 'error' : 'pending');
      pollCount = 0; schedulePoll();
    }
  }
  async function refresh() {
    if (refreshing) return;
    const {owner,provider} = snapshot();
    if (!owner) return;
    const generation = refreshGeneration;
    refreshing = true; render();
    let unavailable = 0;
    const rows = rowsFor(owner).filter(row => !['confirmed','completed','failed','cancelled'].includes(row.state)).slice(0,15);
    try {
      for (const row of rows) {
        if (generation !== refreshGeneration) return;
        try {
          let patch;
          if (core.txUrl(row.hash) && provider) {
            if (Number(await provider.request({method:'eth_chainId'})) !== 8453) throw new Error('Switch to Base to check transaction receipts.');
            const receipt = await provider.request({method:'eth_getTransactionReceipt',params:[row.hash]});
            patch = {state:receipt ? (Number(receipt.status) === 1 ? 'confirmed' : 'failed') : 'pending'};
          } else if (row.operationId && row.portfolioId) {
            const result = await runtime.post('/glider/operation',{portfolioId:row.portfolioId,operationId:row.operationId});
            patch = {state:result.data.state, error:result.data.error || ''};
          } else { unavailable++; continue; }
          if (generation !== refreshGeneration) return;
          const latest = rowsFor(owner);
          const index = latest.findIndex(item => row.hash ? item.hash === row.hash : item.operationId === row.operationId);
          if (index >= 0) latest[index] = {...latest[index],...patch};
          persist(owner, latest);
        } catch { unavailable++; }
      }
      if (generation === refreshGeneration) document.querySelector('#activity-note').textContent = unavailable ? `${unavailable} status check(s) unavailable. Missing references, network access, or API permissions can prevent verification. Nothing was resubmitted.` : `Status checked at ${new Date().toLocaleTimeString()}. Confirmed transfers can still await Glider indexing.`;
    } finally { refreshing = false; if (generation === refreshGeneration) render(); }
  }
  function schedulePoll() {
    clearTimeout(pollTimer);
    if (pollCount >= 24 || !snapshot().owner) return;
    pollTimer = setTimeout(async () => {
      if (document.hidden) return;
      pollCount++;
      await refresh();
      if (rowsFor(snapshot().owner).some(row => ['accepted','running','pending','retrying','awaiting_user'].includes(row.state))) schedulePoll();
    },5000);
  }
  async function review(details) {
    if (cancelReview) return false;
    const origin = snapshot().owner;
    status('Review the details before continuing. No transaction is sent by opening this panel.');
    let integrator = 'Unavailable — not assumed to be zero.';
    try {
      const result = await Promise.race([runtime.post('/glider/fees',{}), new Promise((_,reject) => setTimeout(() => reject(new Error('Fee lookup timed out')),4000))]);
      const bps = result.data?.swapBps;
      if (typeof bps === 'number') integrator = `${bps / 100}% integrator swap fee. This is not a total quote and does not include every provider or network fee.`;
    } catch { /* Permission denied or missing quote is shown explicitly. */ }
    if (!origin || snapshot().owner !== origin) return false;
    document.querySelector('#review-title').textContent = details.title;
    document.querySelector('#review-note').textContent = details.note;
    document.querySelector('#review-fields').innerHTML = [['Amount / action',details.amount],['Network','Base mainnet (8453)'],['From',details.source],['Destination',details.destination],['Network / execution costs',details.fee],['Strategy swap fee',integrator]].map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
    return new Promise(resolve => {
      function finish(confirmed) {
        if (!cancelReview) return;
        cancelReview = null;
        dialog.close();
        document.querySelector('#review-confirm').onclick = null;
        status(confirmed ? 'Continue in your wallet or wait for the Glider request.' : 'Review cancelled. This action was not submitted.',confirmed ? 'pending' : 'neutral');
        resolve(confirmed && snapshot().owner === origin);
      }
      cancelReview = () => finish(false);
      document.querySelector('#review-confirm').onclick = () => finish(true);
      document.querySelector('#review-close').onclick = cancelReview;
      document.querySelector('#review-cancel').onclick = cancelReview;
      dialog.showModal();
      document.querySelector('#review-cancel').focus();
    });
  }
  dialog.addEventListener('cancel',event => {event.preventDefault();cancelReview?.();});
  function reset() {
    refreshGeneration++; clearTimeout(pollTimer); cancelReview?.(); status('');
    document.querySelector('#activity-rows').textContent = 'Connect your wallet to view its recorded activity.';
    document.querySelector('#activity-note').textContent = '';
  }
  window.BaseStockSafety = {record,render,renderEligibility,status,review,reset,walletChanged() {reset(); render(); renderEligibility(); pollCount=0; schedulePoll();}};
  document.querySelector('#refresh-activity').addEventListener('click',async () => {
    await refresh();
    if (snapshot().owner && !runtime.busy()) await runtime.refresh().catch(() => status('Portfolio refresh unavailable. Previously displayed balances may be stale.','warning'));
    renderEligibility();
  });
  for (const id of ['invest-usdc','withdraw-submit','rebalance-all']) {
    const button = document.getElementById(id);
    new MutationObserver(() => {if (button.disabled && /…|\.\.\./.test(button.textContent)) status(button.textContent);}).observe(button,{childList:true,characterData:true,subtree:true});
  }
  render(); renderEligibility();
})();
