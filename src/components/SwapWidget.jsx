import { useState, useMemo, useCallback } from 'react';
import { ArrowDown, Settings, ChevronDown, Loader2, ArrowRight } from 'lucide-react';
import { getToken } from '../data/tokens';
import { getQuote, generateTxHash } from '../data/pools';
import { useWallet } from '../context/WalletContext';
import TokenSelector from './TokenSelector';

export default function SwapWidget({ onSuccess }) {
    const { connected, connectWallet, getBalance, updateBalance } = useWallet();
    const [fromToken, setFromToken] = useState('mMacca');
    const [toToken, setToToken] = useState('mQantas');
    const [amount, setAmount] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(null); // 'from' | 'to' | null
    const [loading, setLoading] = useState(false);

    const fromData = getToken(fromToken);
    const toData = getToken(toToken);
    const numAmount = parseFloat(amount) || 0;

    const quote = useMemo(() => {
        if (numAmount > 0) return getQuote(fromToken, toToken, numAmount);
        return null;
    }, [fromToken, toToken, numAmount]);

    const handleSwapDirection = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount('');
    };

    const handleMaxClick = () => {
        setAmount(getBalance(fromToken).toString());
    };

    const handleSwap = useCallback(async () => {
        if (!quote || numAmount <= 0 || numAmount > getBalance(fromToken)) return;
        setLoading(true);
        // Simulate XRPL transaction
        await new Promise(r => setTimeout(r, 1800));
        const txHash = generateTxHash();
        updateBalance(fromToken, -numAmount);
        updateBalance(toToken, quote.amountOut);
        setLoading(false);
        setAmount('');
        onSuccess({
            fromToken: fromData,
            toToken: toData,
            amountIn: numAmount,
            amountOut: quote.amountOut,
            txHash,
            path: quote.path,
        });
    }, [quote, numAmount, fromToken, toToken, fromData, toData, getBalance, updateBalance, onSuccess]);

    const insufficientBalance = numAmount > getBalance(fromToken);

    const getButtonText = () => {
        if (!connected) return 'Connect Wallet';
        if (!amount || numAmount <= 0) return 'Enter an amount';
        if (insufficientBalance) return `Insufficient ${fromData.symbol} balance`;
        if (loading) return 'Swapping…';
        return 'Swap';
    };

    const isButtonDisabled = () => {
        if (!connected) return false;
        return !amount || numAmount <= 0 || insufficientBalance || loading;
    };

    return (
        <>
            <div className="swap-widget">
                <div className="swap-header">
                    <h3>Swap</h3>
                    <button className="swap-settings-btn" title="Settings">
                        <Settings size={16} />
                    </button>
                </div>

                {/* From Panel */}
                <div className="swap-panel">
                    <div className="swap-panel-label">You pay</div>
                    <div className="swap-panel-row">
                        <input
                            className="swap-amount-input"
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="0"
                        />
                        <button
                            className="token-select-btn"
                            onClick={() => setSelectorOpen('from')}
                        >
                            <span className="token-emoji">{fromData.emoji}</span>
                            {fromData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer">
                        <span>${(numAmount * fromData.price).toFixed(2)}</span>
                        <span
                            className="swap-panel-balance"
                            onClick={handleMaxClick}
                        >
                            Balance: {getBalance(fromToken).toLocaleString()} (MAX)
                        </span>
                    </div>
                </div>

                {/* Direction Toggle */}
                <div className="swap-direction">
                    <button className="swap-direction-btn" onClick={handleSwapDirection}>
                        <ArrowDown size={16} />
                    </button>
                </div>

                {/* To Panel */}
                <div className="swap-panel">
                    <div className="swap-panel-label">You receive</div>
                    <div className="swap-panel-row">
                        <input
                            className="swap-amount-input"
                            type="text"
                            placeholder="0"
                            value={quote ? quote.amountOut.toLocaleString() : ''}
                            disabled
                        />
                        <button
                            className="token-select-btn"
                            onClick={() => setSelectorOpen('to')}
                        >
                            <span className="token-emoji">{toData.emoji}</span>
                            {toData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer">
                        <span>${quote ? (quote.amountOut * toData.price).toFixed(2) : '0.00'}</span>
                        <span>Balance: {getBalance(toToken).toLocaleString()}</span>
                    </div>
                </div>

                {/* Quote Info */}
                {quote && numAmount > 0 && (
                    <div className="swap-info">
                        <div className="swap-info-row">
                            <span className="swap-info-label">Rate</span>
                            <span className="swap-info-value">
                                1 {fromData.symbol} = {quote.rate.toFixed(4)} {toData.symbol}
                            </span>
                        </div>
                        <div className="swap-info-row">
                            <span className="swap-info-label">Price Impact</span>
                            <span className="swap-info-value" style={{
                                color: quote.priceImpact > 3 ? 'var(--red)' : 'var(--text-secondary)'
                            }}>
                                {quote.priceImpact.toFixed(2)}%
                            </span>
                        </div>
                        <div className="swap-info-row">
                            <span className="swap-info-label">Route</span>
                            <div className="swap-path">
                                {quote.path.map((step, i) => (
                                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="swap-path-step">{step}</span>
                                        {i < quote.path.length - 1 && <ArrowRight size={12} className="swap-path-arrow" />}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="swap-info-row">
                            <span className="swap-info-label">Network Fee</span>
                            <span className="swap-info-value">~0.00001 XRP</span>
                        </div>
                    </div>
                )}

                {/* Swap Button */}
                <button
                    className={`swap-execute-btn ${loading ? 'loading' : ''}`}
                    disabled={isButtonDisabled()}
                    onClick={connected ? handleSwap : connectWallet}
                >
                    {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />}
                    {getButtonText()}
                </button>
            </div>

            {/* Token Selector Modals */}
            <TokenSelector
                isOpen={selectorOpen === 'from'}
                onClose={() => setSelectorOpen(null)}
                onSelect={(id) => {
                    if (id === toToken) setToToken(fromToken);
                    setFromToken(id);
                }}
                excludeToken={null}
            />
            <TokenSelector
                isOpen={selectorOpen === 'to'}
                onClose={() => setSelectorOpen(null)}
                onSelect={(id) => {
                    if (id === fromToken) setFromToken(toToken);
                    setToToken(id);
                }}
                excludeToken={null}
            />
        </>
    );
}
