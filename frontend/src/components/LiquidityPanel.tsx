import { Brands } from '../types';

interface LiquidityPanelProps {
    brands: Brands;
}

// Simulated pool data for demo
const POOL_DATA = [
    { pair: 'mQantas/XRP', tvl: '$25,400', apr: '12.5%', position: '2.3%', emojis: ['✈️', '💎'] },
    { pair: 'mMacca/XRP', tvl: '$18,200', apr: '9.8%', position: '1.5%', emojis: ['🍔', '💎'] },
    { pair: 'mGYG/XRP', tvl: '$12,100', apr: '15.2%', position: '0%', emojis: ['🌮', '💎'] },
    { pair: 'mWoolies/XRP', tvl: '$31,500', apr: '8.1%', position: '3.1%', emojis: ['🛒', '💎'] },
    { pair: 'mApple/XRP', tvl: '$45,800', apr: '6.4%', position: '0%', emojis: ['🍎', '💎'] },
    { pair: 'mMS/XRP', tvl: '$8,900', apr: '18.7%', position: '0.8%', emojis: ['💻', '💎'] },
    { pair: 'mJetstar/XRP', tvl: '$15,600', apr: '11.3%', position: '0%', emojis: ['🛩️', '💎'] },
];

export default function LiquidityPanel({ brands }: LiquidityPanelProps) {
    return (
        <div className="liquidity-panel">
            <div className="liquidity-header">
                <h3>💧 Liquidity Pools</h3>
                <span className="liquidity-apr">Avg 11.7% APR</span>
            </div>
            <div className="liquidity-pools">
                {POOL_DATA.map((pool) => (
                    <div key={pool.pair} className="liquidity-pool-row">
                        <div className="pool-pair">
                            <div className="pool-pair-icons">
                                <span>{pool.emojis[0]}</span>
                                <span>{pool.emojis[1]}</span>
                            </div>
                            <div>
                                <div className="pool-pair-name">{pool.pair}</div>
                                <div className="pool-pair-tvl">{pool.tvl} TVL · {pool.apr} APR</div>
                            </div>
                        </div>
                        <div className="pool-actions">
                            <button className="pool-btn add">+ Add</button>
                            {parseFloat(pool.position) > 0 && (
                                <button className="pool-btn withdraw">Withdraw</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
