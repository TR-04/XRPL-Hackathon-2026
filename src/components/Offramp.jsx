import { useState } from 'react';
import { Repeat, ChevronDown, Loader2, ArrowDown, CheckCircle, Clock, Ticket } from 'lucide-react';
import { getToken, TOKENS } from '../data/tokens';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import TokenSelector from './TokenSelector';
import { TokenLogo } from './BrandGrid';

export default function Offramp({ onSuccess }) {
    const { connected, address, walletSeed, balances, updateBalance, connectWallet, refreshBalances } = useWallet();
    const [token, setToken] = useState('mMacca');
    const [amount, setAmount] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [redeeming, setRedeeming] = useState(false);
    const [step, setStep] = useState(0); // 0: idle, 1: burning on XRPL, 2: crediting points, 3: done

    const tokenData = getToken(token);
    const numAmount = parseFloat(amount) || 0;
    const userBalance = balances[token] || 0;
    const exitFee = +(numAmount * 0.003).toFixed(2);
    const netPoints = +(numAmount - exitFee).toFixed(2);

    const handleMax = () => {
        if (userBalance > 0) setAmount(String(userBalance));
    };

    const handleRedeem = async () => {
        if (numAmount <= 0 || numAmount > userBalance) return;
        setRedeeming(true);
        setStep(1);

        try {
            const result = await api.offramp(token, numAmount, walletSeed, 'points_credit');

            setStep(2);
            await new Promise(r => setTimeout(r, 1200));
            setStep(3);

            updateBalance(token, -numAmount);
            refreshBalances();

            await new Promise(r => setTimeout(r, 800));

            if (onSuccess) onSuccess({
                type: 'offramp',
                token: tokenData,
                amount: numAmount,
                netPoints: result?.net_points || netPoints,
                exitFee: result?.exit_fee || exitFee,
                orderId: result?.order_id || '',
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
                    <h3>Redeem Points</h3>
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
                            <div className="onramp-step-title" style={{ opacity: step >= 1 ? 1 : 0.5 }}>Burn tokens on XRPL</div>
                            <div className="onramp-step-desc" style={{ opacity: step >= 1 ? 1 : 0.5 }}>Crypto tokens destroyed on-chain</div>
                        </div>
                    </div>
                    <div className="onramp-step">
                        <div className="onramp-step-number" style={{ background: step >= 2 ? 'var(--pink)' : 'var(--dark-border)', opacity: step >= 2 ? 1 : 0.5 }}>3</div>
                        <div className="onramp-step-content">
                            <div className="onramp-step-title" style={{ opacity: step >= 2 ? 1 : 0.5 }}>Points credited to {tokenData.fullName}</div>
                            <div className="onramp-step-desc" style={{ opacity: step >= 2 ? 1 : 0.5 }}>Points arrive in your loyalty account within 5 mins</div>
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

                {/* Points output */}
                <div className="lp-input-card" style={{ marginBottom: 16 }}>
                    <div className="lp-input-row">
                        <div className="lp-input" style={{ color: numAmount > 0 ? 'var(--green)' : 'var(--text-tertiary)', fontSize: 28, fontWeight: 600 }}>
                            {netPoints > 0 ? netPoints.toLocaleString() : '0'}
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 14px', background: 'var(--dark-border)',
                            borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
                        }}>
                            <TokenLogo token={tokenData} size={18} />
                            {tokenData.name}
                        </div>
                    </div>
                    <div className="swap-panel-footer" style={{ marginTop: 8 }}>
                        <span>Credited to your {tokenData.fullName} account</span>
                        <span>0.3% fee</span>
                    </div>
                </div>

                {/* Delivery info */}
                {numAmount > 0 && (
                    <div style={{
                        padding: '14px 16px', marginBottom: 16,
                        background: 'linear-gradient(135deg, rgba(255,0,122,0.06), rgba(139,92,246,0.06))',
                        border: '1px solid rgba(255,0,122,0.15)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(255,0,122,0.12)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Clock size={20} color="var(--pink)" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                {netPoints.toLocaleString()} points → {tokenData.fullName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                Your points will arrive in your loyalty account within <strong style={{ color: 'var(--pink)' }}>5 minutes</strong>
                            </div>
                        </div>
                    </div>
                )}

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
                            <span>Protocol fee (0.3%)</span>
                            <span>−{exitFee} {tokenData.symbol}</span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span style={{ color: 'var(--text-primary)' }}>Points credited</span>
                            <span style={{ color: 'var(--green)' }}>{netPoints.toLocaleString()} {tokenData.name}</span>
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
                            {step === 1 && 'Burning on XRPL…'}
                            {step === 2 && 'Crediting points…'}
                            {step === 3 && <><CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Order placed!</>}
                        </>
                    ) : numAmount > userBalance ? (
                        'Insufficient balance'
                    ) : (
                        <>
                            <Ticket size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                            Redeem {netPoints > 0 ? netPoints.toLocaleString() : '0'} {tokenData.name}
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
