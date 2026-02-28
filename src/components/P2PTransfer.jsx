import { useState } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getToken, TOKENS } from '../data/tokens';
import { generateTxHash } from '../data/pools';
import { useWallet } from '../context/WalletContext';
import api from '../services/api';
import TokenSelector from './TokenSelector';
import { TokenLogo } from './BrandGrid';

export default function P2PTransfer({ onSuccess }) {
    const wallet = useWallet();
    const {
        connected = false,
        address = '',
        getBalance,
        updateBalance,
        connectWallet,
    } = wallet;

    // These may not exist in every wallet context — guard them
    const refreshBalances = wallet.refreshBalances ?? null;
    const walletSeed = wallet.walletSeed ?? null;

    const [token, setToken] = useState('mQantas');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [memo, setMemo] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const tokenData = getToken(token);

    // Guard: if token data is missing, bail out early
    if (!tokenData) {
        return (
            <div className="transfer-section">
                <div className="transfer-card">
                    <p style={{ color: 'red' }}>Token "{token}" not found. Please select a valid token.</p>
                    <TokenSelector
                        isOpen={true}
                        onClose={() => { }}
                        onSelect={(t) => setToken(t)}
                        excludeToken={null}
                    />
                </div>
            </div>
        );
    }

    const numAmount = parseFloat(amount) || 0;
    const balance = typeof getBalance === 'function' ? (getBalance(token) ?? 0) : 0;

    const handleSend = async () => {
        if (numAmount <= 0 || !recipient.trim() || numAmount > balance) return;
        setLoading(true);

        let txHash = null;

        try {
            if (typeof api?.sendTransfer === 'function') {
                const result = await api.sendTransfer(token, numAmount, recipient, walletSeed, memo);
                if (result && result.tx_hash) {
                    txHash = result.tx_hash;
                }
            }
        } catch (e) {
            console.warn('API transfer failed, using simulated:', e?.message);
        }

        if (!txHash) {
            await new Promise(r => setTimeout(r, 1200));
            txHash = generateTxHash();
        }

        if (typeof updateBalance === 'function') {
            updateBalance(token, -numAmount);
        }

        setLoading(false);
        setAmount('');
        setRecipient('');
        setMemo('');

        if (typeof refreshBalances === 'function') {
            try {
                refreshBalances();
            } catch (e) {
                console.warn('refreshBalances failed:', e?.message);
            }
        }


        if (onSuccess) {
            onSuccess({
                type: 'transfer',
                token: tokenData,
                amount: numAmount,
                recipient,
                txHash,
            });
        }
    };

    return (
        <div className="transfer-section">
            <div className="transfer-card">
                <div className="lp-header">
                    <h3>Send Tokens</h3>
                    <span
                        className="lp-badge"
                        style={{
                            background: 'rgba(255,0,122,0.1)',
                            color: 'var(--pink)',
                        }}
                    >
                        P2P
                    </span>
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
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={amount}
                            onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setAmount(e.target.value); }}
                        />
                        <button
                            className="token-select-btn"
                            onClick={() => setSelectorOpen(true)}
                        >
                            <TokenLogo token={tokenData} size={22} className="token-emoji" />
                            {tokenData.symbol}
                            <ChevronDown size={14} className="chevron" />
                        </button>
                    </div>
                    <div className="swap-panel-footer" style={{ marginTop: 8 }}>
                        <span>
                            ${(numAmount * (tokenData.price ?? 0)).toFixed(2)}
                        </span>
                        <span>Balance: {balance.toLocaleString()}</span>
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
                    disabled={
                        !connected ||
                        numAmount <= 0 ||
                        !recipient.trim() ||
                        numAmount > balance ||
                        loading
                    }
                    onClick={connected ? handleSend : connectWallet}
                >
                    {!connected ? (
                        'Connect Wallet'
                    ) : loading ? (
                        'Sending…'
                    ) : (
                        <>
                            <Send
                                size={16}
                                style={{
                                    display: 'inline',
                                    verticalAlign: 'middle',
                                    marginRight: 8,
                                }}
                            />
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
                onSelect={(t) => {
                    setToken(t);
                    setSelectorOpen(false);
                }}
                excludeToken={null}
            />
        </div>
    );
}