import { useState } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getToken, TOKENS } from '../data/tokens';
import { generateTxHash } from '../data/pools';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import TokenSelector from './TokenSelector';

export default function P2PTransfer({ onSuccess }) {
    const { connected, address, getBalance, updateBalance, connectWallet, refreshBalances, walletSeed } = useWallet();
    const [token, setToken] = useState('mQantas');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [memo, setMemo] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const tokenData = getToken(token);
    const numAmount = parseFloat(amount) || 0;

    const handleSend = async () => {
        if (numAmount <= 0 || !recipient || numAmount > getBalance(token)) return;
        setLoading(true);

        let txHash = null;

        try {
            const result = await api.sendTransfer(token, numAmount, recipient, walletSeed, memo);
            if (result && result.tx_hash) {
                txHash = result.tx_hash;
            }
        } catch (e) {
            console.warn('API transfer failed, using simulated:', e.message);
        }

        if (!txHash) {
            await new Promise(r => setTimeout(r, 1200));
            txHash = generateTxHash();
        }

        updateBalance(token, -numAmount);
        setLoading(false);
        setAmount('');
        setRecipient('');
        setMemo('');

        refreshBalances();

        if (onSuccess) onSuccess({
            type: 'transfer',
            token: tokenData,
            amount: numAmount,
            recipient,
            txHash,
        });
    };

    return (
        <div className="transfer-section">
            <div className="transfer-card">
                <div className="lp-header">
                    <h3>Send Tokens</h3>
                    <span className="lp-badge" style={{ background: 'rgba(255,0,122,0.1)', color: 'var(--pink)' }}>P2P</span>
                </div>

                <input
                    className="transfer-addr-input"
                    type="text"
                    placeholder="Recipient XRPL address (r...)"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                />

                <div className="lp-input-card" style={{ marginBottom: 12 }}>
                    <div className="lp-input-row">
                        <input
                            className="lp-input"
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                        <button className="token-select-btn" onClick={() => setSelectorOpen(true)}>
                            <span className="token-emoji">{tokenData.emoji}</span>
                            {tokenData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer" style={{ marginTop: 8 }}>
                        <span>${(numAmount * tokenData.price).toFixed(2)}</span>
                        <span>Balance: {getBalance(token).toLocaleString()}</span>
                    </div>
                </div>

                <input
                    className="transfer-addr-input"
                    type="text"
                    placeholder="Memo (optional) — e.g. Happy birthday! 🎉"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    style={{ marginBottom: 16 }}
                />

                <button
                    className="transfer-send-btn"
                    disabled={!connected || numAmount <= 0 || !recipient || loading}
                    onClick={connected ? handleSend : connectWallet}
                >
                    {!connected ? 'Connect Wallet' : loading ? 'Sending…' : (
                        <>
                            <Send size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                            Send {tokenData.symbol}
                        </>
                    )}
                </button>

                {connected && address && (
                    <div className="qr-section">
                        <span className="qr-label">Your receive QR code</span>
                        <div className="qr-wrapper">
                            <QRCodeSVG
                                value={`xrpl:${address}?token=${token}`}
                                size={140}
                                bgColor="#FFFFFF"
                                fgColor="#1A1A1A"
                                level="M"
                            />
                        </div>
                    </div>
                )}
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
