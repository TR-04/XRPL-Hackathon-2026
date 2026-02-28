import { Wallet, ChevronDown, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const TABS = ['Swap', 'Transfer', 'On-Ramp'];

export default function Navbar({ activeTab, onTabChange }) {
    const { connected, connecting, connectStatus, address, xrpBalance, backendOnline, connectWallet, disconnectWallet } = useWallet();

    const truncatedAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : '';

    return (
        <nav className="navbar">
            <a href="/" className="navbar-logo">
                <div className="logo-icon">🔄</div>
                Loyalty<span className="logo-accent">Swap</span>
            </a>

            <div className="navbar-center">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => onTabChange(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="navbar-right">
                <div className="network-badge">
                    <span className="network-dot" style={{ background: backendOnline ? 'var(--green)' : '#FFD700' }} />
                    XRPL Testnet
                </div>
                {connected ? (
                    <button className="connect-btn connected" onClick={disconnectWallet}>
                        <div className="wallet-avatar" />
                        {truncatedAddress}
                        {xrpBalance && <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 4 }}>({parseFloat(xrpBalance).toFixed(1)} XRP)</span>}
                        <ChevronDown size={14} />
                    </button>
                ) : (
                    <button
                        className={`connect-btn ${connecting ? 'connecting' : ''}`}
                        onClick={connectWallet}
                        disabled={connecting}
                    >
                        {connecting ? (
                            <>
                                <Loader2 size={16} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                                {connectStatus || 'Connecting…'}
                            </>
                        ) : (
                            <>
                                <Wallet size={16} />
                                Connect Xaman
                            </>
                        )}
                    </button>
                )}
            </div>
        </nav>
    );
}
