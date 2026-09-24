import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, useConnectWallet, useWallets } from '@privy-io/react-auth';
import { base } from 'viem/chains';

const selectionKey = 'basestock10:privy:wallet';
const notify = message => window.dispatchEvent(new CustomEvent('basestock:wallet-error', { detail: message }));
const publish = session => window.dispatchEvent(new CustomEvent('basestock:wallet', { detail: session }));
const savedSelection = () => { try { return localStorage.getItem(selectionKey) || ''; } catch { return ''; } };
const saveSelection = value => { try { localStorage.setItem(selectionKey, value); } catch { /* Storage can be disabled. */ } };

function WalletBridge() {
  const { wallets, ready } = useWallets();
  const [selected, setSelected] = useState(savedSelection);
  const [showAccount, setShowAccount] = useState(false);
  const session = useRef(null);
  const accountDialog = useRef(null);
  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      saveSelection(wallet.address);
      setSelected(wallet.address);
    },
    onError: error => {
      // Privy calls this when someone deliberately closes its selector. Closing
      // is normal and should not create an alarming app-level notice.
      const message = String(error?.message || error || '');
      if (message && !/cancel|close|dismiss|exit|generic_connect_wallet_error/i.test(message)) {
        notify('Wallet connection could not be completed: ' + message);
      }
    }
  });

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const wallet = wallets.find(item => item.address.toLowerCase() === selected.toLowerCase());
    if (!wallet) {
      if (session.current) { session.current = null; publish(null); }
      return;
    }
    wallet.getEthereumProvider().then(provider => {
      if (cancelled) return;
      const previous = session.current;
      session.current = { address: wallet.address, provider, wallet };
      if (!previous || previous.address !== wallet.address || previous.provider !== provider) publish(session.current);
    }).catch(() => {
      if (cancelled) return;
      session.current = null;
      publish(null);
      notify('Unable to access this wallet. Please reconnect it.');
    });
    return () => { cancelled = true; };
  }, [ready, selected, wallets]);

  // Publish during render instead of an effect. `useConnectWallet` can change
  // its callback identity while Privy initializes; an effect cleanup in that
  // window briefly removed the bridge and made the page say "still loading".
  window.BaseStockWallet = {
    ready,
    getSession: () => session.current,
    open: () => {
      if (session.current) setShowAccount(true);
      else connectWallet({ walletChainType: 'ethereum-only' });
    }
  };

  useEffect(() => {
    if (showAccount && !accountDialog.current.open) accountDialog.current.showModal();
    else if (!showAccount && accountDialog.current.open) accountDialog.current.close();
  }, [showAccount]);

  async function disconnect() {
    const previous = session.current;
    session.current = null;
    saveSelection('');
    setSelected('');
    setShowAccount(false);
    publish(null);
    try { await previous?.wallet.disconnect(); }
    catch { notify('Disconnected from BaseStock10. You can also remove the connection in your wallet settings.'); }
  }

  return <dialog ref={accountDialog} className="wallet-dialog" onCancel={() => setShowAccount(false)} onClick={event => {
    if (event.target === event.currentTarget) setShowAccount(false);
  }} aria-labelledby="connected-wallet-title">
    <div className="wallet-dialog-head"><h2 id="connected-wallet-title">Your wallet</h2><button type="button" className="wallet-close" aria-label="Close wallet details" onClick={() => setShowAccount(false)}>×</button></div>
    <p className="wallet-status" style={{ overflowWrap: 'anywhere' }}>{selected}</p>
    <div className="wallet-options">
      <button type="button" onClick={() => { setShowAccount(false); connectWallet({ walletChainType: 'ethereum-only' }); }}>Connect a different wallet</button>
      <button type="button" onClick={disconnect}>Disconnect wallet</button>
    </div>
    <footer className="wallet-powered">Wallet connection by Privy · Base network</footer>
  </dialog>;
}

class WalletErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    window.BaseStockWallet = { ready: true, getSession: () => null, open: () => notify('Wallet connection could not load. Please refresh or try another browser.') };
  }
  render() { return this.state.failed ? null : this.props.children; }
}

const appId = window.BASE_TEN_CONFIG?.privyAppId;
if (appId) {
  createRoot(document.getElementById('privy-root')).render(
    <WalletErrorBoundary>
      <PrivyProvider appId={appId} config={{
        loginMethods: ['wallet'],
        defaultChain: base,
        supportedChains: [base],
        externalWallets: { coinbaseWallet: { config: { preference: { options: 'eoaOnly' } } } },
        appearance: {
          theme: 'dark', accentColor: '#9de6c6', walletChainType: 'ethereum-only',
          logo: 'https://pbs.twimg.com/profile_images/2099922210244943872/Aj3klXlT_400x400.jpg',
          walletList: ['detected_ethereum_wallets', 'metamask', 'coinbase_wallet', 'okx_wallet', 'rainbow', 'wallet_connect', 'wallet_connect_qr']
        },
        embeddedWallets: { ethereum: { createOnLogin: 'off' } }
      }}><WalletBridge /></PrivyProvider>
    </WalletErrorBoundary>
  );
} else {
  window.BaseStockWallet = { ready: true, getSession: () => null, open: () => notify('Wallet connection is not configured yet. Please contact BaseStock10.') };
}
