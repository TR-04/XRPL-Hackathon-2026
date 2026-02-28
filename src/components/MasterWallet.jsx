import { useState, useEffect } from 'react';
import { Shield, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { TOKENS } from '../data/tokens';
import api from '../services/api';

export default function MasterWallet() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRevenue = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const result = await api.getProtocolRevenue();
            if (result) setData(result);
        } catch (e) {
            console.warn('Failed to fetch protocol revenue:', e.message);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchRevenue();
        const interval = setInterval(() => fetchRevenue(true), 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="master-section">
                <div className="master-card" style={{ textAlign: 'center', padding: 48 }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--pink)' }} />
                    <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Loading master wallet...</p>
                </div>
            </div>
        );
    }

    if (!data || data.error) {
        return (
            <div className="master-section">
                <div className="master-card" style={{ textAlign: 'center', padding: 48 }}>
                    <Shield size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Master wallet not available</p>
                </div>
            </div>
        );
    }

    const balances = data.balances || {};
    const revenue = data.revenue_tracked || {};
    const truncAddr = data.address
        ? `${data.address.slice(0, 8)}...${data.address.slice(-6)}`
        : '—';

    // Calculate total USD revenue
    const totalUsdRevenue = TOKENS.reduce((sum, t) => {
        const bal = parseFloat(balances[t.id] || 0);
        return sum + bal * t.price;
    }, 0);

    return (
        <div className="master-section">
            {/* Header card */}
            <div className="master-card">
                <div className="master-header">
                    <div className="master-header-left">
                        <div className="master-icon">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="master-title">Master Wallet</h3>
                            <p className="master-subtitle">Protocol fee collector — {data.fee_rate} on every transaction</p>
                        </div>
                    </div>
                    <button
                        className="master-refresh-btn"
                        onClick={() => fetchRevenue(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                    </button>
                </div>

                {/* Address */}
                <div className="master-address-row">
                    <span className="master-address">{truncAddr}</span>
                    <a
                        href={data.explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="master-explorer-link"
                    >
                        View on Explorer <ExternalLink size={12} />
                    </a>
                </div>

                {/* Stats Row */}
                <div className="master-stats">
                    <div className="master-stat">
                        <div className="master-stat-label">Total Revenue (USD)</div>
                        <div className="master-stat-value" style={{ color: 'var(--green)' }}>
                            ${totalUsdRevenue.toFixed(2)}
                        </div>
                    </div>
                    <div className="master-stat">
                        <div className="master-stat-label">Transactions</div>
                        <div className="master-stat-value">{data.total_tx || 0}</div>
                    </div>
                    <div className="master-stat">
                        <div className="master-stat-label">XRP Balance</div>
                        <div className="master-stat-value">
                            {parseFloat(balances.xrp || 0).toFixed(2)} XRP
                        </div>
                    </div>
                </div>
            </div>

            {/* Token Balances */}
            <div className="master-card">
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Collected Fees by Token</h4>
                <div className="master-token-list">
                    {TOKENS.map(token => {
                        const bal = parseFloat(balances[token.id] || 0);
                        const usd = bal * token.price;
                        const tracked = revenue[token.id] || 0;
                        return (
                            <div key={token.id} className="master-token-row">
                                <div className="master-token-left">
                                    <div className="master-token-emoji" style={{ background: token.colorLight }}>
                                        {token.emoji}
                                    </div>
                                    <div>
                                        <div className="master-token-name">{token.symbol}</div>
                                        <div className="master-token-sub">{token.name}</div>
                                    </div>
                                </div>
                                <div className="master-token-right">
                                    <div className="master-token-bal">{bal.toLocaleString()}</div>
                                    <div className="master-token-usd">${usd.toFixed(2)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Full Address for easy copy */}
            <div className="master-card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>Full Master Wallet Address</p>
                <code className="master-full-address" onClick={() => navigator.clipboard.writeText(data.address)}>
                    {data.address}
                </code>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Click to copy</p>
            </div>
        </div>
    );
}
