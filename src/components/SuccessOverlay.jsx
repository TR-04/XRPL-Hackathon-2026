import ReactConfetti from 'react-confetti';
import { ExternalLink, Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function SuccessOverlay({ data, onClose }) {
    const [copied, setCopied] = useState(false);

    if (!data) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(data.txHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getTitle = () => {
        if (data.type === 'transfer') return 'Transfer Sent!';
        if (data.type === 'withdraw') return 'Withdrawal Complete!';
        if (data.type === 'mint') return 'Tokens Minted!';
        if (data.type === 'liquidity') return 'Liquidity Added!';
        return 'Swap Successful!';
    };

    const getSubtitle = () => {
        if (data.type === 'transfer') {
            return `${data.amount.toLocaleString()} ${data.token.symbol} sent`;
        }
        if (data.type === 'withdraw') {
            const dest = data.destination || '';
            const destShort = dest.length > 18 ? `${dest.slice(0, 8)}...${dest.slice(-6)}` : dest;
            return `${data.amount.toLocaleString()} ${data.token.symbol} withdrawn to ${destShort || 'external wallet'}`;
        }
        if (data.type === 'mint') {
            return `${data.amount.toLocaleString()} ${data.token.symbol} minted to your wallet`;
        }
        if (data.type === 'liquidity') {
            return `Added ${data.amountA.toLocaleString()} ${data.tokenA.symbol} + ${data.amountB.toLocaleString()} ${data.tokenB.symbol}`;
        }
        return `Swapped ${data.amountIn.toLocaleString()} ${data.fromToken.symbol} for ${data.amountOut.toLocaleString()} ${data.toToken.symbol}`;
    };

    const explorerUrl = `https://testnet.xrpl.org/transactions/${data.txHash}`;

    return (
        <div className="success-overlay">
            <ReactConfetti
                width={window.innerWidth}
                height={window.innerHeight}
                numberOfPieces={200}
                recycle={false}
                colors={['#FF007A', '#FF6B9D', '#8B5CF6', '#27AE60', '#FFC107', '#FFB8D9']}
            />
            <div className="success-card">
                <div className="success-icon">
                    <Check size={36} color="white" />
                </div>
                <h2 className="success-title">{getTitle()}</h2>
                <p className="success-subtitle">{getSubtitle()}</p>

                {(data.path || data.type === 'withdraw') && (
                    <div className="success-details">
                        {data.path && (
                            <div className="success-detail-row">
                                <span className="success-detail-label">Route</span>
                                <span className="success-detail-value">{data.path.join(' → ')}</span>
                            </div>
                        )}
                        {data.type === 'withdraw' && data.destination && (
                            <div className="success-detail-row">
                                <span className="success-detail-label">To</span>
                                <span className="success-detail-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{data.destination}</span>
                            </div>
                        )}
                        <div className="success-detail-row">
                            <span className="success-detail-label">Network</span>
                            <span className="success-detail-value">XRPL Testnet</span>
                        </div>
                        <div className="success-detail-row">
                            <span className="success-detail-label">Time</span>
                            <span className="success-detail-value" style={{ color: 'var(--green)' }}>~1.8s</span>
                        </div>
                    </div>
                )}

                {data.type === 'swap' && data.balances && (
                    <div className="success-balances">
                        <div className="success-balances-title">Updated balances</div>
                        <div className="success-balances-grid">
                            {data.fromToken && (
                                <div className="success-balance-item">
                                    <span className="success-balance-token">{data.fromToken.symbol}</span>
                                    <span className="success-balance-value">
                                        {parseFloat(data.balances[data.fromToken.id] || 0).toLocaleString()} pts
                                    </span>
                                </div>
                            )}
                            {data.toToken && (
                                <div className="success-balance-item">
                                    <span className="success-balance-token">{data.toToken.symbol}</span>
                                    <span className="success-balance-value">
                                        {parseFloat(data.balances[data.toToken.id] || 0).toLocaleString()} pts
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="success-hash" onClick={handleCopy} title="Click to copy">
                    {copied ? '✓ Copied!' : `TX: ${data.txHash.slice(0, 16)}...${data.txHash.slice(-8)}`}
                </div>

                <div className="success-actions">
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, padding: 12, borderRadius: 12, border: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'var(--dark-hover)', color: 'var(--text-primary)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--dark-border)' }}
                    >
                        <ExternalLink size={14} />
                        Explorer
                    </a>
                    <button className="primary" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}
