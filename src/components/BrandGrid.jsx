import { TOKENS } from '../data/tokens';
import { useWallet } from '../context/WalletContext';

export default function BrandGrid({ onSelectToken }) {
    const { getBalance } = useWallet();

    return (
        <div className="brand-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Loyalty Tokens</h2>
                    <p className="section-subtitle">7 Australian brands tokenised on XRPL</p>
                </div>
            </div>
            <div className="brand-grid">
                {TOKENS.map(token => {
                    const changeClass = token.change24h > 0 ? 'positive' : token.change24h < 0 ? 'negative' : 'neutral';
                    const changePrefix = token.change24h > 0 ? '+' : '';
                    return (
                        <div
                            key={token.id}
                            className="brand-card"
                            style={{ '--card-accent': token.color }}
                            onClick={() => onSelectToken(token.id)}
                        >
                            <div className="brand-card-top">
                                <div className="brand-card-icon" style={{ background: token.colorLight }}>
                                    {token.emoji}
                                </div>
                                <span className={`brand-card-change ${changeClass}`}>
                                    {changePrefix}{token.change24h.toFixed(1)}%
                                </span>
                            </div>
                            <div className="brand-card-name">{token.symbol}</div>
                            <div className="brand-card-symbol">{token.name}</div>
                            <div className="brand-card-bottom">
                                <div className="brand-card-price">${token.price.toFixed(2)}</div>
                                <div className="brand-card-balance">{getBalance(token.id).toLocaleString()} pts</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
