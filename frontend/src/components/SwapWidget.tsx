import { useState, useEffect } from 'react';
import { Brands, WalletState, QuoteResponse } from '../types';
import { api } from '../api/client';
import TokenSelector from './TokenSelector';

interface SwapWidgetProps {
    brands: Brands;
    wallet: WalletState | null;
    onSwapComplete: (result: { tx_hash: string; explorer: string; details: string }) => void;
    onRefreshBalances: () => void;
}

export default function SwapWidget({ brands, wallet, onSwapComplete, onRefreshBalances }: SwapWidgetProps) {
    const brandNames = Object.keys(brands);
    const [fromToken, setFromToken] = useState(brandNames[0] || 'mMacca');
    const [toToken, setToToken] = useState(brandNames[1] || 'mQantas');
    const [amount, setAmount] = useState('');
    const [quote, setQuote] = useState<QuoteResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [swapping, setSwapping] = useState(false);
    const [selectingFor, setSelectingFor] = useState<'from' | 'to' | null>(null);

    // Debounced quote fetch
    useEffect(() => {
        if (!amount || parseFloat(amount) <= 0 || fromToken === toToken) {
            setQuote(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const q = await api.getQuote(fromToken, toToken, parseFloat(amount));
                setQuote(q);
            } catch (err) {
                console.error('Quote error:', err);
                setQuote(null);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [amount, fromToken, toToken]);

    const handleToggle = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount('');
        setQuote(null);
    };

    const handleSwap = async () => {
        if (!wallet || !quote || swapping) return;
        setSwapping(true);
        try {
            const result = await api.executeSwap(fromToken, toToken, parseFloat(amount), wallet.seed);
            onSwapComplete({
                tx_hash: result.tx_hash,
                explorer: result.explorer,
                details: `Swapped ${result.input_amount} ${fromToken} → ${result.output_amount} ${toToken}`,
            });
            setAmount('');
            setQuote(null);
            onRefreshBalances();
        } catch (err: any) {
            alert('Swap failed: ' + err.message);
        } finally {
            setSwapping(false);
        }
    };

    const fromBalance = wallet?.balances[fromToken] || '0';
    const toBalance = wallet?.balances[toToken] || '0';
    const fromBrand = brands[fromToken];
    const toBrand = brands[toToken];

    const canSwap = wallet?.connected && quote && !swapping && parseFloat(amount) > 0;

    return (
        <>
            <div className="swap-widget">
                <div className="swap-header">
                    <h3>Swap</h3>
                    <button className="swap-settings" title="Settings">⚙️</button>
                </div>

                {/* From token */}
                <div className="swap-token-box">
                    <div className="swap-token-row">
                        <button className="token-selector" onClick={() => setSelectingFor('from')}>
                            <span className="token-emoji">{fromBrand?.emoji}</span>
                            <span className="token-name">{fromToken}</span>
                            <span className="token-arrow">▼</span>
                        </button>
                        <input
                            className="swap-amount-input"
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="swap-token-bottom-row">
                        <span>${fromBrand ? (parseFloat(amount || '0') * fromBrand.mock_price_usd).toFixed(2) : '0.00'}</span>
                        <span className="swap-balance" onClick={() => setAmount(fromBalance)}>
                            Balance: {parseFloat(fromBalance).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Toggle */}
                <div className="swap-toggle">
                    <button className="swap-toggle-btn" onClick={handleToggle}>↕</button>
                </div>

                {/* To token */}
                <div className="swap-token-box">
                    <div className="swap-token-row">
                        <button className="token-selector" onClick={() => setSelectingFor('to')}>
                            <span className="token-emoji">{toBrand?.emoji}</span>
                            <span className="token-name">{toToken}</span>
                            <span className="token-arrow">▼</span>
                        </button>
                        <input
                            className="swap-amount-input"
                            type="number"
                            placeholder="0"
                            value={quote ? quote.output_amount.toLocaleString() : ''}
                            readOnly
                        />
                    </div>
                    <div className="swap-token-bottom-row">
                        <span>${quote && toBrand ? (quote.output_amount * toBrand.mock_price_usd).toFixed(2) : '0.00'}</span>
                        <span>Balance: {parseFloat(toBalance).toLocaleString()}</span>
                    </div>
                </div>

                {/* Swap info */}
                {quote && (
                    <div className="swap-info">
                        <div className="swap-info-row">
                            <span>Expected Output</span>
                            <span>{quote.output_amount.toLocaleString()} {toToken}</span>
                        </div>
                        <div className="swap-info-row">
                            <span>Price Impact</span>
                            <span style={{ color: quote.price_impact > 1 ? 'var(--orange)' : 'var(--text-secondary)' }}>
                                {quote.price_impact.toFixed(2)}%
                            </span>
                        </div>
                        <div className="swap-info-row">
                            <span>Route</span>
                            <div className="swap-path">
                                {quote.path.map((step, i) => (
                                    <span key={i}>
                                        {i > 0 && <span className="swap-path-arrow"> → </span>}
                                        <span className="swap-path-step">{step}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Swap button */}
                <button
                    className={`swap-btn ${swapping ? 'loading' : canSwap ? 'active' : 'disabled'}`}
                    onClick={handleSwap}
                    disabled={!canSwap}
                >
                    {swapping ? 'Swapping...' : !wallet?.connected ? 'Connect Wallet' : !amount ? 'Enter Amount' : loading ? 'Getting Quote...' : 'Swap'}
                </button>
            </div>

            {/* Token selector dropdown */}
            {selectingFor && (
                <TokenSelector
                    brands={brands}
                    wallet={wallet}
                    onSelect={(token) => {
                        if (selectingFor === 'from') {
                            if (token === toToken) setToToken(fromToken);
                            setFromToken(token);
                        } else {
                            if (token === fromToken) setFromToken(toToken);
                            setToToken(token);
                        }
                        setSelectingFor(null);
                        setQuote(null);
                    }}
                    onClose={() => setSelectingFor(null)}
                />
            )}
        </>
    );
}
