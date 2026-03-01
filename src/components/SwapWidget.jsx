import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowDown, ChevronDown, Loader2, ArrowRight } from 'lucide-react';
import { getToken } from '../data/tokens';
import { getQuote as getLocalQuote, generateTxHash } from '../data/pools';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import TokenSelector from './TokenSelector';
import { TokenLogo } from './BrandGrid';

export default function SwapWidget({ onSuccess }) {
    const { connected, connectWallet, getBalance, updateBalance, applyBalances, refreshBalances, backendOnline, walletSeed } = useWallet();
    const [fromToken, setFromToken] = useState('mMacca');
    const [toToken, setToToken] = useState('mQantas');
    const [amount, setAmount] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(null); // 'from' | 'to' | null
    const [loading, setLoading] = useState(false);
    const [apiQuote, setApiQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    const fromData = getToken(fromToken);
    const toData = getToken(toToken);
    const numAmount = parseFloat(amount) || 0;

    // Fetch quote from backend (with debounce)
    useEffect(() => {
        if (numAmount <= 0 || fromToken === toToken) {
            setApiQuote(null);
            return;
        }

        const timeout = setTimeout(async () => {
            setQuoteLoading(true);
            try {
                const q = await api.getQuote(fromToken, toToken, numAmount);
                if (q) {
                    setApiQuote(q);
                    setQuoteLoading(false);
                    return;
                }
            } catch (e) {
                console.warn('API quote failed, using local:', e.message);
            }
            // Fallback to local quote
            setApiQuote(null);
            setQuoteLoading(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [fromToken, toToken, numAmount]);

    // Use API quote if available, otherwise local
    const localQuote = useMemo(() => {
        if (numAmount > 0) return getLocalQuote(fromToken, toToken, numAmount);
        return null;
    }, [fromToken, toToken, numAmount]);

    const quote = apiQuote ? {
        amountOut: apiQuote.output_amount,
        path: apiQuote.path,
        priceImpact: apiQuote.price_impact,
        fee: apiQuote.fee,
        rate: apiQuote.rate,
        xrpIntermediate: apiQuote.xrp_intermediate,
    } : localQuote;

    const handleSwapDirection = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount('');
        setApiQuote(null);
    };

    const handleMaxClick = () => {
        setAmount(getBalance(fromToken).toString());
    };

    const handleSwap = useCallback(async () => {
        if (!quote || numAmount <= 0 || numAmount > getBalance(fromToken)) return;
        setLoading(true);

        let txHash = null;
        let outputAmount = quote.amountOut;
        let result = null;

        try {
            // Try real API swap
            result = await api.executeSwap(fromToken, toToken, numAmount, walletSeed);
            if (result && result.tx_hash) {
                txHash = result.tx_hash;
                outputAmount = result.output_amount || quote.amountOut;
            }
        } catch (e) {
            console.warn('API swap failed, using simulated:', e.message);
        }

        if (!txHash) {
            // Fallback: simulate
            await new Promise(r => setTimeout(r, 1800));
            txHash = generateTxHash();
        }

        if (result?.balances) {
            applyBalances(result.balances);
        } else {
            updateBalance(fromToken, -numAmount);
            updateBalance(toToken, outputAmount);
            refreshBalances();
        }

        setLoading(false);
        setAmount('');
        setApiQuote(null);

        onSuccess({
            type: 'swap',
            fromToken: fromData,
            toToken: toData,
            amountIn: numAmount,
            amountOut: outputAmount,
            txHash,
            path: quote.path,
            balances: result?.balances,
        });
    }, [quote, numAmount, fromToken, toToken, fromData, toData, getBalance, updateBalance, applyBalances, refreshBalances, onSuccess]);

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
                            <TokenLogo token={fromData} size={22} className="token-emoji" />
                            {fromData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer">
                        <span></span>
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
                            <TokenLogo token={toData} size={22} className="token-emoji" />
                            {toData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer">
                        <span></span>
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
