import { WalletState } from '../types';

interface NavbarProps {
    wallet: WalletState | null;
    onConnect: () => void;
}

export default function Navbar({ wallet, onConnect }: NavbarProps) {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <div className="logo-icon">🔄</div>
                <span>LoyaltySwap</span>
            </div>

            <div className="navbar-search">
                <span style={{ color: 'var(--text-muted)' }}>🔍</span>
                <input type="text" placeholder="Search tokens..." />
            </div>

            <div className="navbar-actions">
                {wallet?.connected ? (
                    <button className="btn-connect connected">
                        <span className="wallet-dot"></span>
                        <span>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                        <span className="wallet-xrp">{parseFloat(wallet.balances.xrp || '0').toFixed(1)} XRP</span>
                    </button>
                ) : (
                    <button className="btn-connect" onClick={onConnect}>
                        Connect Xaman
                    </button>
                )}
            </div>
        </nav>
    );
}
