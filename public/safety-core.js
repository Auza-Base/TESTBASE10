(function(root) {
  const api = {
    escape(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
    txUrl(hash) { return /^0x[a-fA-F0-9]{64}$/.test(hash || '') ? `https://basescan.org/tx/${hash}` : null; },
    read(storage, key) {
      try { const rows = JSON.parse(storage.getItem(key) || '[]'); return Array.isArray(rows) ? rows.filter(row => row && typeof row === 'object').slice(0,100) : []; } catch { return []; }
    },
    eligibility(value, connected, now = Date.now()) {
      if (!connected) return ['Connect to check', 'Connect your wallet to compare its indexed portfolio value with the published campaign threshold.'];
      if (now < Date.parse('2026-08-24T00:00:00Z')) return ['Campaign not started', 'Published campaign: August 24–October 23, 2026.'];
      if (now >= Date.parse('2026-10-24T00:00:00Z')) return ['Published campaign has ended', 'The published end date was October 23, 2026. Check the provider for any extension.'];
      if (value == null || !Number.isFinite(Number(value))) return ['Value unavailable', 'Refresh your portfolio to check the published balance threshold.'];
      if (Number(value) < 300) return ['Below $300 threshold', 'Your indexed portfolio value is below the published minimum. A 25 USDC deposit alone does not qualify.'];
      return ['Balance threshold met · not verified', 'Your indexed total is at least $300, but may include uninvested USDC. Only the campaign provider can confirm eligible holdings and rewards. Rewards are capped at $50,000 of eligible holdings.'];
    },
    withdrawalMatches(data, expected) {
      const m = data?.message;
      return Number(data?.domain?.chainId) === 8453 && m?.portfolioId === expected.portfolioId &&
        String(m?.recipientAccountId).toLowerCase() === `eip155:8453:${expected.owner}`.toLowerCase() &&
        Array.isArray(m.assets) && m.assets.length === 1 && m.assets[0].assetId?.toLowerCase() === expected.assetId.toLowerCase() &&
        String(m.assets[0].amountRaw) === String(expected.amountRaw);
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BaseStockSafetyCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
