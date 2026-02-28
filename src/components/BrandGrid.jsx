import { useState } from 'react';
import { TOKENS } from '../data/tokens';
import { useWallet } from '../context/WalletContext';

function TokenLogo({ token, size = 32, className = '' }) {
    const [imgError, setImgError] = useState(false);

    if (imgError) {
        return <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{token.emoji}</span>;
    }

    return (
        <img
            src={token.logo}
            alt={token.symbol}
            className={className}
            style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6 }}
            onError={() => setImgError(true)}
        />
    );
}

export { TokenLogo };

export default function BrandGrid({ onSelectToken }) {
    const { getBalance } = useWallet();

    // Duplicate tokens for seamless infinite scroll
    const doubledTokens = [...TOKENS, ...TOKENS];

    return (
        <div className="brand-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Loyalty Tokens</h2>
                    <p className="section-subtitle">7 Australian brands tokenised on XRPL</p>
                </div>
            </div>
            <div className="brand-carousel">
                <div className="brand-carousel-track">
                    {doubledTokens.map((token, idx) => {
                        const changeClass = token.change24h > 0 ? 'positive' : token.change24h < 0 ? 'negative' : 'neutral';
                        const changePrefix = token.change24h > 0 ? '+' : '';
                        return (
                            <div
                                key={`${token.id}-${idx}`}
                                className="brand-card"
                                style={{ '--card-accent': token.color }}
                                onClick={() => onSelectToken(token.id)}
                            >
                                <div className="brand-card-top">
                                    <div className="brand-card-icon" style={{ background: token.colorLight }}>
                                        <TokenLogo token={token} size={30} />
                                    </div>
                                    <span className={`brand-card-change ${changeClass}`}>
                                        {changePrefix}{token.change24h.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="brand-card-name">{token.symbol}</div>
                                <div className="brand-card-symbol">{token.name}</div>
                                <div className="brand-card-bottom">
                                    <div className="brand-card-balance">{getBalance(token.id).toLocaleString()} pts</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
