import { useState, useCallback } from 'react';
import { ArrowLeftRight, Send, QrCode, Shield } from 'lucide-react';
import Navbar from './components/Navbar';
import SwapWidget from './components/SwapWidget';
import BrandGrid from './components/BrandGrid';
import P2PTransfer from './components/P2PTransfer';
import OnRamp from './components/OnRamp';
import MasterWallet from './components/MasterWallet';
import SuccessOverlay from './components/SuccessOverlay';

export default function App() {
    const [activeTab, setActiveTab] = useState('Swap');
    const [successData, setSuccessData] = useState(null);

    const handleSuccess = useCallback((data) => {
        setSuccessData(data);
    }, []);

    const handleSelectToken = useCallback((tokenId) => {
        setActiveTab('Swap');
        // Scroll to top for swap widget
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <div className="app">
            <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

            <main className="app-container">
                {/* Hero */}
                <div className="hero-section">
                    <h1 className="hero-subtitle">
                        {activeTab === 'Swap' && 'Swap loyalty points instantly'}
                        {activeTab === 'Transfer' && 'Send points to anyone'}
                        {activeTab === 'On-Ramp' && 'Deposit your loyalty points'}
                        {activeTab === 'Master' && 'Protocol revenue dashboard'}
                    </h1>
                </div>

                {/* Tab Content */}
                {activeTab === 'Swap' && (
                    <>
                        <SwapWidget onSuccess={handleSuccess} />
                        <BrandGrid onSelectToken={handleSelectToken} />
                    </>
                )}

                {activeTab === 'Transfer' && (
                    <P2PTransfer onSuccess={handleSuccess} />
                )}

                {activeTab === 'On-Ramp' && (
                    <OnRamp onSuccess={handleSuccess} />
                )}

                {activeTab === 'Master' && (
                    <MasterWallet />
                )}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-nav">
                <div className="mobile-nav-items">
                    {[
                        { tab: 'Swap', icon: <ArrowLeftRight size={18} />, label: 'Swap' },
                        { tab: 'Transfer', icon: <Send size={18} />, label: 'Send' },
                        { tab: 'On-Ramp', icon: <QrCode size={18} />, label: 'Deposit' },
                        { tab: 'Master', icon: <Shield size={18} />, label: 'Master' },
                    ].map(({ tab, icon, label }) => (
                        <button
                            key={tab}
                            className={`mobile-nav-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Success Overlay */}
            <SuccessOverlay data={successData} onClose={() => setSuccessData(null)} />
        </div>
    );
}
