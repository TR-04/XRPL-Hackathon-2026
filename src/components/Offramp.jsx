import { useState } from 'react';
import { Banknote, ChevronDown, Loader2, ArrowDown, CheckCircle } from 'lucide-react';
import { getToken, TOKENS } from '../data/tokens';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import TokenSelector from './TokenSelector';
import { TokenLogo } from './BrandGrid';

const PAYOUT_METHODS = [
    { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', eta: '1-2 business days' },
    { id: 'payid', label: 'PayID', icon: '⚡', eta: 'Instant' },
    { id: 'gift_card', label: 'Gift Card', icon: '🎁', eta: 'Instant' },
];

export default function Offramp({ onSuccess }) {
    const { connected, address, walletSeed, balances, updateBalance, connectWallet, refreshBalances } = useWallet();
    const [token, setToken] = useState('mMacca');
    const [amount, setAmount] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [redeeming, setRedeeming] = useState(false);
    const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
    const [step, setStep] = useState(0); // 0: idle, 1: burning, 2: processing payout, 3: done

    const tokenData = getToken(token);
    const numAmount = parseFloat(amount) || 0;
    const userBalance = balances[token] || 0;
    const exitFee = +(numAmount * 0.003).toFixed(2);
    const netAmount = +(numAmount - exitFee).toFixed(2);
    const audValue = +(netAmount * tokenData.price).toFixed(2);
    const selectedPayout = PAYOUT_METHODS.find(p => p.id === payoutMethod);

    const handleMax = () => {
        if (userBalance > 0) setAmount(String(userBalance));
    };

    const handleRedeem = async () => {
        if (numAmount <= 0 || numAmount > userBalance) return;
        setRedeeming(true);
        setStep(1);

        try {
            // Call backend offramp endpoint
            const result = await api.offramp(token, numAmount, walletSeed, payoutMethod);

            setStep(2);
            // Brief delay to show "processing payout" step
            await new Promise(r => setTimeout(r, 1200));
            setStep(3);

            // Update local balance
            updateBalance(token, -numAmount);
            refreshBalances();

            await new Promise(r => setTimeout(r, 800));

            if (onSuccess) onSuccess({
                type: 'offramp',
                token: tokenData,
                amount: numAmount,
                audValue: result?.aud_value || audValue,
                exitFee: result?.exit_fee || exitFee,
                payoutMethod: selectedPayout.label,
                txHash: result?.tx_hash || '',
            });

            setAmount('');
            setStep(0);
        } catch (e) {
            console.warn('Offramp failed:', e.message);
            setStep(0);
        }

        setRedeeming(false);
    };

    return (
        <div className="onramp-section">
            <div className="onramp-card">
                <div className="lp-header">
                    <h3>Cash Out</h3>
                    <span className="lp-badge" style={{ background: 'rgba(255,0,122,0.1)', color: 'var(--pink)' }}>Off-Ramp</span>
                </div>

                {/* Steps indicator */}
                <div className="onramp-steps">
                    <div className="onramp-step">
                        <div className="onramp-step-number" style={{ background: step >= 1 ? 'var(--pink)' : 'var(--dark-border)' }}>1</div>
                        <div className="onramp-step-content">
                            <div className="onramp-step-title">Select token & amount</div>
                            <div className="onramp-step-desc">Choose which loyalty tokens to redeem</div>
                        </div>
                    </div>
                    <div className="onramp-step">
                        <div className="onramp-step-number" style={{ background: step >= 1 ? 'var(--pink)' : 'var(--dark-border)', opacity: step >= 1 ? 1 : 0.5 }}>2</div>
                        <div className="onramp-step-content">
                            <div className="onramp-step-title" style={{ opacity: step >= 1 ? 1 : 0.5 }}>Burn tokens on-ledger</div>
                            <div className="onramp-step-desc" style={{ opacity: step >= 1 ? 1 : 0.5 }}>Tokens destroyed on XRPL — verified on-chain</div>
                        </div>
                    </div>
                    <div className="onramp-step">
                        <div className="onramp-step-number" style={{ background: step >= 2 ? 'var(--pink)' : 'var(--dark-border)', opacity: step >= 2 ? 1 : 0.5 }}>3</div>
                        <div className="onramp-step-content">
                            <div className="onramp-step-title" style={{ opacity: step >= 2 ? 1 : 0.5 }}>Receive AUD payout</div>
                            <div className="onramp-step-desc" style={{ opacity: step >= 2 ? 1 : 0.5 }}>Fiat sent via {selectedPayout.label}</div>
                        </div>
                    </div>
                </div>

                {/* Token + Amount input */}
                <div className="lp-input-card" style={{ marginBottom: 12 }}>
                    <div className="lp-input-row">
                        <input
                            className="lp-input"
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={amount}
                            onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setAmount(e.target.value); }}
                            disabled={redeeming}
                        />
                        <button className="token-select-btn" onClick={() => !redeeming && setSelectorOpen(true)}>
                            <TokenLogo token={tokenData} size={22} className="token-emoji" />
                            {tokenData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer" style={{ marginTop: 8 }}>
                        <span style={{ cursor: 'pointer' }} onClick={handleMax}>
                            Balance: {userBalance.toLocaleString()} {tokenData.symbol}
                        </span>
                        <span style={{ cursor: 'pointer', color: 'var(--pink)' }} onClick={handleMax}>MAX</span>
                    </div>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--dark-border)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ArrowDown size={16} color="var(--text-secondary)" />
                    </div>
                </div>

                {/* AUD output */}
                <div className="lp-input-card" style={{ marginBottom: 16 }}>
                    <div className="lp-input-row">
                        <div className="lp-input" style={{ color: numAmount > 0 ? 'var(--green)' : 'var(--text-tertiary)', fontSize: 28, fontWeight: 600 }}>
                            ${audValue > 0 ? audValue.toLocaleString() : '0.00'}
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 14px', background: 'var(--dark-border)',
                            borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
                        }}>
                            🇦🇺 AUD
                        </div>
                    </div>
                    <div className="swap-panel-footer" style={{ marginTop: 8 }}>
                        <span>Rate: 1 {tokenData.symbol} = ${tokenData.price.toFixed(2)} AUD</span>
                        <span>0.3% exit fee</span>
                    </div>
                </div>

                {/* Payout method selector */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Payout Method</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {PAYOUT_METHODS.map(method => (
                            <button
                                key={method.id}
                                onClick={() => !redeeming && setPayoutMethod(method.id)}
                                style={{
                                    flex: 1,
                                    padding: '10px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `1.5px solid ${payoutMethod === method.id ? 'var(--pink)' : 'var(--dark-border)'}`,
                                    background: payoutMethod === method.id ? 'rgba(255,0,122,0.08)' : 'var(--dark-card)',
                                    color: 'var(--text-primary)',
                                    cursor: redeeming ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 12,
                                }}
                            >
                                <span style={{ fontSize: 18 }}>{method.icon}</span>
                                <span style={{ fontWeight: 500 }}>{method.label}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{method.eta}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fee breakdown */}
                {numAmount > 0 && (
                    <div style={{
                        padding: '12px 16px', marginBottom: 16,
                        background: 'var(--dark-surface)', borderRadius: 'var(--radius-sm)',
                        fontSize: 13, color: 'var(--text-secondary)',
                        display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>You redeem</span>
                            <span style={{ color: 'var(--text-primary)' }}>{numAmount.toLocaleString()} {tokenData.symbol}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Exit fee (0.3%)</span>
                            <span>−{exitFee} {tokenData.symbol}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Net burned</span>
                            <span>{netAmount} {tokenData.symbol}</span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span style={{ color: 'var(--text-primary)' }}>You receive</span>
                            <span style={{ color: 'var(--green)' }}>${audValue.toLocaleString()} AUD</span>
                        </div>
                    </div>
                )}

                {/* CTA button */}
                <button
                    className={`onramp-mint-btn ${redeeming ? 'minting' : ''}`}
                    disabled={!connected || numAmount <= 0 || numAmount > userBalance || redeeming}
                    onClick={connected ? handleRedeem : connectWallet}
                    style={{ background: connected && numAmount > 0 && !redeeming ? 'var(--pink)' : undefined }}
                >
                    {!connected ? 'Connect Wallet' : redeeming ? (
                        <>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                            {step === 1 && 'Burning tokens…'}
                            {step === 2 && 'Processing payout…'}
                            {step === 3 && <><CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Done!</>}
                        </>
                    ) : numAmount > userBalance ? (
                        'Insufficient balance'
                    ) : (
                        <>
                            <Banknote size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                            Redeem for ${audValue > 0 ? audValue.toLocaleString() : '0.00'} AUD
                        </>
                    )}
                </button>
            </div>

            <TokenSelector
                isOpen={selectorOpen}
                onClose={() => setSelectorOpen(false)}
                onSelect={setToken}
                excludeToken={null}
            />
        </div>
    );
}
