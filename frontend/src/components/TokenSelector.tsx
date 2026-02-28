import { Brands, WalletState } from '../types';

interface TokenSelectorProps {
    brands: Brands;
    wallet: WalletState | null;
    onSelect: (token: string) => void;
    onClose: () => void;
}

export default function TokenSelector({ brands, wallet, onSelect, onClose }: TokenSelectorProps) {
    return (
        <div className="token-dropdown-overlay" onClick={onClose}>
            <div className="token-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="token-dropdown-header">
                    <h3>Select a Token</h3>
                    <button className="token-dropdown-close" onClick={onClose}>✕</button>
                </div>
                <div className="token-dropdown-list">
                    {Object.entries(brands).map(([name, brand]) => {
                        const balance = wallet?.balances[name] || '0';
                        const usdValue = parseFloat(balance) * brand.mock_price_usd;
                        return (
                            <div key={name} className="token-dropdown-item" onClick={() => onSelect(name)}>
                                <div className="token-icon" style={{ background: `${brand.color}22` }}>
                                    {brand.emoji}
                                </div>
                                <div className="token-details">
                                    <div className="name">{name}</div>
                                    <div className="brand">{brand.display_name}</div>
                                </div>
                                <div className="token-balance-right">
                                    <div className="amount">{parseFloat(balance).toLocaleString()}</div>
                                    <div className="usd">${usdValue.toFixed(2)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
