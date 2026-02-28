import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { Brands, WalletState } from './types';
import { api } from './api/client';
import Navbar from './components/Navbar';
import SwapWidget from './components/SwapWidget';
import BrandGrid from './components/BrandGrid';
import LiquidityPanel from './components/LiquidityPanel';
import TransactionModal from './components/TransactionModal';
import TransferCard from './components/TransferCard';

// Default brand data (used before backend config is loaded)
const DEFAULT_BRANDS: Brands = {
  mMacca: { currency_code: 'MAC', emoji: '🍔', color: '#FF2D08', mock_price_usd: 0.80, display_name: "McDonald's Points", issuer_address: null },
  mQantas: { currency_code: 'QAN', emoji: '✈️', color: '#E4002B', mock_price_usd: 1.00, display_name: 'Qantas Frequent Flyer', issuer_address: null },
  mJetstar: { currency_code: 'JET', emoji: '🛩️', color: '#FF6600', mock_price_usd: 0.95, display_name: 'Jetstar Points', issuer_address: null },
  mGYG: { currency_code: 'GYG', emoji: '🌮', color: '#FFD700', mock_price_usd: 0.45, display_name: 'Guzman y Gomez Rewards', issuer_address: null },
  mApple: { currency_code: 'APL', emoji: '🍎', color: '#A2AAAD', mock_price_usd: 2.50, display_name: 'Apple Rewards', issuer_address: null },
  mMS: { currency_code: 'MSF', emoji: '💻', color: '#00A4EF', mock_price_usd: 0.10, display_name: 'Microsoft Rewards', issuer_address: null },
  mWoolies: { currency_code: 'WOL', emoji: '🛒', color: '#125F1A', mock_price_usd: 0.02, display_name: 'Woolworths Everyday Rewards', issuer_address: null },
};

type Tab = 'swap' | 'transfer' | 'pools';

function App() {
  const [brands, setBrands] = useState<Brands>(DEFAULT_BRANDS);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [txResult, setTxResult] = useState<{ tx_hash: string; explorer: string; details: string } | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [activeTab, setActiveTab] = useState<Tab>('swap');
  const [connecting, setConnecting] = useState(false);

  // Check backend health on load
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.health();
        setBackendStatus(health.xrpl_connected ? 'connected' : 'disconnected');
      } catch {
        setBackendStatus('disconnected');
      }
    };
    checkHealth();

    // Load brand config from backend
    api.getBrands().then(setBrands).catch(() => { });
  }, []);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (!wallet?.connected) return;
    try {
      const result = await api.getBalances(wallet.address);
      setWallet((prev) => prev ? { ...prev, balances: result.balances } : null);
    } catch (err) {
      console.error('Balance refresh failed:', err);
    }
  }, [wallet?.address, wallet?.connected]);

  // Connect wallet
  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const result = await api.connectWallet();
      setWallet({
        connected: true,
        address: result.address,
        seed: result.seed,
        jwt: result.jwt,
        balances: result.balances,
      });
    } catch (err: any) {
      alert('Connection failed: ' + err.message + '\n\nMake sure the backend is running at localhost:8000');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div>
      {/* Status banner */}
      <div className={`status-banner ${backendStatus === 'connected' ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {backendStatus === 'checking' ? 'Connecting to XRPL Testnet...' :
          backendStatus === 'connected' ? 'Connected to XRPL Testnet' :
            'Backend offline — start server at localhost:8000'}
      </div>

      <Navbar wallet={wallet} onConnect={handleConnect} />

      <div className="app-container">
        {/* Hero */}
        <div className="hero-section">
          <h1 className="hero-title">Swap Loyalty Anywhere</h1>
          <p className="hero-subtitle">
            Convert loyalty points across 7 Australian brands instantly on the XRP Ledger
          </p>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === 'swap' ? 'active' : ''}`} onClick={() => setActiveTab('swap')}>Swap</button>
          <button className={`tab-btn ${activeTab === 'transfer' ? 'active' : ''}`} onClick={() => setActiveTab('transfer')}>Transfer</button>
          <button className={`tab-btn ${activeTab === 'pools' ? 'active' : ''}`} onClick={() => setActiveTab('pools')}>Pools</button>
        </div>

        {/* Tabs */}
        {activeTab === 'swap' && (
          <SwapWidget
            brands={brands}
            wallet={wallet}
            onSwapComplete={setTxResult}
            onRefreshBalances={refreshBalances}
          />
        )}

        {activeTab === 'transfer' && (
          <TransferCard
            brands={brands}
            wallet={wallet}
            onTransferComplete={setTxResult}
            onRefreshBalances={refreshBalances}
          />
        )}

        {activeTab === 'pools' && (
          <LiquidityPanel brands={brands} />
        )}

        {/* Brand Grid — always visible */}
        <BrandGrid
          brands={brands}
          wallet={wallet}
          onMintComplete={setTxResult}
          onRefreshBalances={refreshBalances}
        />
      </div>

      {/* Transaction Modal */}
      <TransactionModal result={txResult} onClose={() => setTxResult(null)} />
    </div>
  );
}

export default App;
