import { useState } from 'react';
import { Brands, WalletState } from '../types';
import { api } from '../api/client';

interface BrandGridProps {
    brands: Brands;
    wallet: WalletState | null;
    onMintComplete: (result: { tx_hash: string; explorer: string; details: string }) => void;
    onRefreshBalances: () => void;
}

// Simulated price changes for visual flair
const PRICE_CHANGES: Record<string, { pct: number; dir: 'up' | 'down' | 'neutral' }> = {
    mMacca: { pct: 0, dir: 'neutral' },
    mQantas: { pct: 2.1, dir: 'up' },
    mJetstar: { pct: 1.2, dir: 'down' },
    mGYG: { pct: 5.3, dir: 'up' },
    mApple: { pct: 0, dir: 'neutral' },
    mMS: { pct: 3.1, dir: 'down' },
    mWoolies: { pct: 1.4, dir: 'up' },
};

export default function BrandGrid({ brands, wallet, onMintComplete, onRefreshBalances }: BrandGridProps) {
    const [minting, setMinting] = useState<string | null>(null);

    const handleMint = async (tokenName: string) => {
        if (!wallet?.connected || minting) return;
        setMinting(tokenName);
        try {
            const result = await api.mintToken(tokenName, wallet.address, 1000);
            onMintComplete({
                tx_hash: result.tx_hash,
                explorer: result.explorer,
                details: `Minted ${result.amount} ${tokenName} 🎉`,
            });
            onRefreshBalances();
        } catch (err: any) {
            alert('Mint failed: ' + err.message);
        } finally {
            setMinting(null);
        }
    };

    return (
        <div>
            <div className="section-header">
                <h2>🏪 Loyalty Brands</h2>
                <span className="see-all">View all →</span>
            </div>
            <div className="brand-grid">
                {Object.entries(brands).map(([name, brand]) => {
                    const change = PRICE_CHANGES[name] || { pct: 0, dir: 'neutral' };
                    const balance = wallet?.balances[name] || '0';
                    return (
                        <div
                            key={name}
                            className="brand-card"
                            style={{ '--card-accent': brand.color } as React.CSSProperties}
                        >
                            <div className="brand-card-emoji">{brand.emoji}</div>
                            <div className="brand-card-name">{name}</div>
                            <div className="brand-card-price">
                                ${brand.mock_price_usd.toFixed(2)}
                                <span className={`brand-card-change ${change.dir}`}>
                                    {change.dir === 'up' ? '▲' : change.dir === 'down' ? '▼' : '●'}
                                    {change.pct > 0 ? `${change.pct}%` : ''}
                                </span>
                            </div>
                            {wallet?.connected && (
                                <>
                                    <div className="brand-card-balance">
                                        Balance: <span>{parseFloat(balance).toLocaleString()}</span>
                                    </div>
                                    <button
                                        className="brand-card-mint"
                                        onClick={() => handleMint(name)}
                                        disabled={minting === name}
                                    >
                                        {minting === name ? 'Minting...' : `📱 Scan & Mint 1,000 ${name}`}
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
