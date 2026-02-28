import { TrendingUp, DollarSign, Activity, Zap } from 'lucide-react';

export default function RevenueWidget() {
    return (
        <div className="revenue-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Platform Stats</h2>
                    <p className="section-subtitle">Mock revenue & network metrics</p>
                </div>
            </div>
            <div className="revenue-grid">
                <div className="revenue-card">
                    <div className="revenue-card-label">
                        <DollarSign size={14} />
                        Total Volume (24h)
                    </div>
                    <div className="revenue-card-value" style={{ color: 'var(--green)' }}>$127,450</div>
                    <div className="revenue-card-sub">↑ 12.3% from yesterday</div>
                </div>
                <div className="revenue-card">
                    <div className="revenue-card-label">
                        <TrendingUp size={14} />
                        Platform Fees Earned
                    </div>
                    <div className="revenue-card-value">$382.35</div>
                    <div className="revenue-card-sub">0.3% AMM + 1% ramp</div>
                </div>
                <div className="revenue-card">
                    <div className="revenue-card-label">
                        <Activity size={14} />
                        Total Swaps
                    </div>
                    <div className="revenue-card-value">1,247</div>
                    <div className="revenue-card-sub">Across 7 pools</div>
                </div>
                <div className="revenue-card">
                    <div className="revenue-card-label">
                        <Zap size={14} />
                        Avg. Execution
                    </div>
                    <div className="revenue-card-value" style={{ color: 'var(--pink)' }}>&lt;3s</div>
                    <div className="revenue-card-sub">XRPL native speed</div>
                </div>
            </div>
        </div>
    );
}
