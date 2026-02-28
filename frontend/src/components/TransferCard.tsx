import { useState } from 'react';
import { Brands, WalletState } from '../types';
import { api } from '../api/client';

interface TransferCardProps {
    brands: Brands;
    wallet: WalletState | null;
    onTransferComplete: (result: { tx_hash: string; explorer: string; details: string }) => void;
    onRefreshBalances: () => void;
}

export default function TransferCard({ brands, wallet, onTransferComplete, onRefreshBalances }: TransferCardProps) {
    const brandNames = Object.keys(brands);
    const [token, setToken] = useState(brandNames[1] || 'mQantas');
    const [amount, setAmount] = useState('');
    const [toAddress, setToAddress] = useState('');
    const [memo, setMemo] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!wallet || !amount || !toAddress || sending) return;
        setSending(true);
        try {
            const result = await api.sendTransfer(token, parseFloat(amount), toAddress, wallet.seed, memo);
            onTransferComplete({
                tx_hash: result.tx_hash,
                explorer: result.explorer,
                details: `Sent ${result.amount} ${token} to ${result.to_address.slice(0, 8)}...`,
            });
            setAmount('');
            setToAddress('');
            setMemo('');
            onRefreshBalances();
        } catch (err: any) {
            alert('Transfer failed: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="transfer-section">
            <div className="transfer-card">
                <h3>🎁 Send Tokens (P2P)</h3>
                <div className="transfer-input-group">
                    <label>Token</label>
                    <select value={token} onChange={(e) => setToken(e.target.value)}>
                        {brandNames.map((name) => (
                            <option key={name} value={name}>
                                {brands[name].emoji} {name} (Balance: {parseFloat(wallet?.balances[name] || '0').toLocaleString()})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="transfer-input-group">
                    <label>Amount</label>
                    <input
                        type="number"
                        placeholder="500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <div className="transfer-input-group">
                    <label>Recipient Address</label>
                    <input
                        type="text"
                        placeholder="rFriendAddress..."
                        value={toAddress}
                        onChange={(e) => setToAddress(e.target.value)}
                    />
                </div>
                <div className="transfer-input-group">
                    <label>Memo (optional)</label>
                    <input
                        type="text"
                        placeholder="Happy birthday! 🎉"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                    />
                </div>
                <button
                    className={`swap-btn ${wallet?.connected && amount && toAddress ? 'active' : 'disabled'}`}
                    onClick={handleSend}
                    disabled={!wallet?.connected || !amount || !toAddress || sending}
                    style={{ marginTop: '16px' }}
                >
                    {sending ? 'Sending...' : 'Send Tokens'}
                </button>
            </div>
        </div>
    );
}
