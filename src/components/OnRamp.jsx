import { useState } from 'react';
import { QrCode, ChevronDown, Loader2 } from 'lucide-react';
import { getToken, TOKENS } from '../data/tokens';
import { generateTxHash } from '../data/pools';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import TokenSelector from './TokenSelector';

export default function OnRamp({ onSuccess }) {
    const { connected, address, walletSeed, updateBalance, connectWallet, refreshBalances } = useWallet();
    const [token, setToken] = useState('mMacca');
    const [amount, setAmount] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [minting, setMinting] = useState(false);
    const [step, setStep] = useState(0); // 0: idle, 1: scanning, 2: confirming

    const tokenData = getToken(token);
    const numAmount = parseFloat(amount) || 0;

    const handleMint = async () => {
        if (numAmount <= 0) return;
        setMinting(true);
        setStep(1);

        let txHash = null;

        // Simulate QR scan delay
        await new Promise(r => setTimeout(r, 1000));
        setStep(2);

        try {
            // Try real API mint
            const result = await api.mintToken(token, address, numAmount, `${token}_qr_mock_${Date.now()}`, walletSeed);
            if (result && result.tx_hash) {
                txHash = result.tx_hash;
            }
        } catch (e) {
            console.warn('API mint failed, using simulated:', e.message);
        }

        if (!txHash) {
            // Fallback: simulate mint
            await new Promise(r => setTimeout(r, 1000));
            txHash = generateTxHash();
        }

        updateBalance(token, numAmount);
        setMinting(false);
        setStep(0);
        setAmount('');

        // Refresh from backend
        refreshBalances();

        if (onSuccess) onSuccess({
            type: 'mint',
            token: tokenData,
            amount: numAmount,
            txHash,
        });
    };

    return (
        <div className="onramp-section">
            <div className="onramp-card">
                <div className="lp-header">
                    <h3>Deposit Points</h3>
                    <span className="lp-badge" style={{ background: 'rgba(39,174,96,0.1)', color: 'var(--green)' }}>On-Ramp</span>
                </div>

                <div className="onramp-steps">
                    <div className="onramp-step">
                        <div className="onramp-step-number" style={{ background: step >= 1 ? 'var(--green)' : 'var(--pink)' }}>1</div>
                        <div className="onramp-step-content">
                            <div className="onramp-step-title">Select brand & amount</div>
                            <div className="onramp-step-desc">Choose your loyalty program and points to deposit</div>
                        </div>
                    </div>
                    <div className="onramp-step">
                        <div className="onramp-step-number" style={{ background: step >= 1 ? 'var(--pink)' : 'var(--dark-border)', opacity: step >= 1 ? 1 : 0.5 }}>2</div>
                        <div className="onramp-step-content">
                            <div className="onramp-step-title" style={{ opacity: step >= 1 ? 1 : 0.5 }}>Scan brand QR code</div>
                            <div className="onramp-step-desc" style={{ opacity: step >= 1 ? 1 : 0.5 }}>Verify points with the loyalty provider</div>
                        </div>
                    </div>
                    <div className="onramp-step">
                        <div className="onramp-step-number" style={{ background: step >= 2 ? 'var(--pink)' : 'var(--dark-border)', opacity: step >= 2 ? 1 : 0.5 }}>3</div>
                        <div className="onramp-step-content">
                            <div className="onramp-step-title" style={{ opacity: step >= 2 ? 1 : 0.5 }}>Mint MPT tokens</div>
                            <div className="onramp-step-desc" style={{ opacity: step >= 2 ? 1 : 0.5 }}>1:1 custodial mint to your XRPL wallet</div>
                        </div>
                    </div>
                </div>

                <div className="lp-input-card" style={{ marginBottom: 16 }}>
                    <div className="lp-input-row">
                        <input
                            className="lp-input"
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            disabled={minting}
                        />
                        <button className="token-select-btn" onClick={() => !minting && setSelectorOpen(true)}>
                            <span className="token-emoji">{tokenData.emoji}</span>
                            {tokenData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer" style={{ marginTop: 8 }}>
                        <span>${(numAmount * tokenData.price).toFixed(2)} value</span>
                        <span>1:1 mint ratio</span>
                    </div>
                </div>

                <button
                    className={`onramp-mint-btn ${minting ? 'minting' : ''}`}
                    disabled={!connected || numAmount <= 0 || minting}
                    onClick={connected ? handleMint : connectWallet}
                >
                    {!connected ? 'Connect Wallet' : minting ? (
                        <>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                            {step === 1 ? 'Scanning QR…' : 'Minting tokens…'}
                        </>
                    ) : (
                        <>
                            <QrCode size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                            Scan & Mint {tokenData.symbol}
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
