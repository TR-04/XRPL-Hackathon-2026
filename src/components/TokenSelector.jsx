import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { TOKENS } from '../data/tokens';
import { useWallet } from '../context/WalletContext';
import { TokenLogo } from './BrandGrid';

export default function TokenSelector({ isOpen, onClose, onSelect, excludeToken }) {
    const [search, setSearch] = useState('');
    const { getBalance } = useWallet();

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return TOKENS.filter(t =>
            t.id !== excludeToken &&
            (t.name.toLowerCase().includes(q) ||
                t.symbol.toLowerCase().includes(q) ||
                t.fullName.toLowerCase().includes(q))
        );
    }, [search, excludeToken]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Select a token</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="modal-search">
                    <input
                        type="text"
                        placeholder="Search by name or symbol..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="token-list">
                    {filtered.map(token => (
                        <div
                            key={token.id}
                            className="token-list-item"
                            onClick={() => { onSelect(token.id); onClose(); setSearch(''); }}
                        >
                            <div className="token-list-item-left">
                                <div
                                    className="token-list-emoji"
                                    style={{ background: token.colorLight }}
                                >
                                    <TokenLogo token={token} size={24} />
                                </div>
                                <div>
                                    <div className="token-list-name">{token.symbol}</div>
                                    <div className="token-list-symbol">{token.name}</div>
                                </div>
                            </div>
                            <div className="token-list-item-right">
                                <div className="token-list-balance">{getBalance(token.id).toLocaleString()}</div>
                                <div className="token-list-usd">${(getBalance(token.id) * token.price).toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            No tokens found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
