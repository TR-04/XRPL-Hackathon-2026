import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TOKENS, getToken } from '../data/tokens';
import { getPool } from '../data/pools';
import { useWallet } from '../context/WalletContext';
import TokenSelector from './TokenSelector';

export default function LiquidityPanel({ onSuccess }) {
    const { connected, getBalance, updateBalance, connectWallet } = useWallet();
    const [tokenA, setTokenA] = useState('mMacca');
    const [tokenB, setTokenB] = useState('mQantas');
    const [amountA, setAmountA] = useState('');
    const [amountB, setAmountB] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(null);
    const [loading, setLoading] = useState(false);

    const dataA = getToken(tokenA);
    const dataB = getToken(tokenB);
    const poolA = getPool(tokenA);
    const poolB = getPool(tokenB);
    const numA = parseFloat(amountA) || 0;
    const numB = parseFloat(amountB) || 0;

    const handleAdd = async () => {
        if (numA <= 0 || numB <= 0) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        updateBalance(tokenA, -numA);
        updateBalance(tokenB, -numB);
        setLoading(false);
        setAmountA('');
        setAmountB('');
        if (onSuccess) onSuccess({
            type: 'liquidity',
            tokenA: dataA,
            tokenB: dataB,
            amountA: numA,
            amountB: numB,
        });
    };

    return (
        <div className="liquidity-section">
            <div className="lp-card">
                <div className="lp-header">
                    <h3>Add Liquidity</h3>
                    <span className="lp-badge">0.3% fee tier</span>
                </div>

                <div className="lp-inputs">
                    <div className="lp-input-card">
                        <div className="lp-input-row">
                            <input
                                className="lp-input"
                                type="number"
                                placeholder="0"
                                value={amountA}
                                onChange={e => setAmountA(e.target.value)}
                            />
                            <button className="token-select-btn" onClick={() => setSelectorOpen('a')}>
                                <span className="token-emoji">{dataA.emoji}</span>
                                {dataA.symbol}
                                <ChevronDown size={14} className="chevron" />
                            </button>
                        </div>
                    </div>
                    <div className="lp-input-card">
                        <div className="lp-input-row">
                            <input
                                className="lp-input"
                                type="number"
                                placeholder="0"
                                value={amountB}
                                onChange={e => setAmountB(e.target.value)}
                            />
                            <button className="token-select-btn" onClick={() => setSelectorOpen('b')}>
                                <span className="token-emoji">{dataB.emoji}</span>
                                {dataB.symbol}
                                <ChevronDown size={14} className="chevron" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lp-stats">
                    <div className="lp-stat">
                        <div className="lp-stat-label">Pool TVL</div>
                        <div className="lp-stat-value">${poolA ? poolA.tvl.toLocaleString() : '—'}</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-label">APY</div>
                        <div className="lp-stat-value" style={{ color: 'var(--green)' }}>{poolA ? poolA.apy : '—'}%</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-label">Your Share</div>
                        <div className="lp-stat-value">{numA > 0 ? '<0.01%' : '—'}</div>
                    </div>
                </div>

                <button
                    className="lp-add-btn"
                    disabled={!connected || numA <= 0 || numB <= 0 || loading}
                    onClick={connected ? handleAdd : connectWallet}
                >
                    {!connected ? 'Connect Wallet' : loading ? 'Adding Liquidity…' : 'Add Liquidity'}
                </button>
            </div>

            <TokenSelector
                isOpen={selectorOpen === 'a'}
                onClose={() => setSelectorOpen(null)}
                onSelect={(id) => {
                    if (id === tokenB) setTokenB(tokenA);
                    setTokenA(id);
                }}
                excludeToken={null}
            />
            <TokenSelector
                isOpen={selectorOpen === 'b'}
                onClose={() => setSelectorOpen(null)}
                onSelect={(id) => {
                    if (id === tokenA) setTokenA(tokenB);
                    setTokenB(id);
                }}
                excludeToken={null}
            />
        </div>
    );
}
