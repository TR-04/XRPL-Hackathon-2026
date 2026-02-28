import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { TOKENS } from '../data/tokens';
import { connectWalletAPI, getBalances } from '../services/api';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [address, setAddress] = useState('');
    const [seed, setSeed] = useState('');
    const [balances, setBalances] = useState(() => {
        const b = {};
        TOKENS.forEach(t => { b[t.id] = t.userBalance; });
        return b;
    });
    const refreshTimer = useRef(null);

    const refreshBalances = useCallback(async (addr) => {
        if (!addr) return;
        try {
            const data = await getBalances(addr);
            setBalances(prev => {
                const next = { ...prev };
                TOKENS.forEach(t => {
                    const val = parseFloat(data[t.id]);
                    if (!isNaN(val)) next[t.id] = val;
                });
                return next;
            });
        } catch (err) {
            console.warn('Balance refresh failed:', err);
        }
    }, []);

    const connectWallet = useCallback(async () => {
        setConnecting(true);
        try {
            const data = await connectWalletAPI();
            setAddress(data.address);
            setSeed(data.seed);
            setConnected(true);
            // Set initial balances from backend
            if (data.balances) {
                setBalances(prev => {
                    const next = { ...prev };
                    TOKENS.forEach(t => {
                        const val = parseFloat(data.balances[t.id]);
                        if (!isNaN(val)) next[t.id] = val;
                    });
                    return next;
                });
            }
            // Start periodic balance refresh (every 15s)
            if (refreshTimer.current) clearInterval(refreshTimer.current);
            refreshTimer.current = setInterval(() => refreshBalances(data.address), 15000);
        } catch (err) {
            console.error('Wallet connect failed:', err);
        } finally {
            setConnecting(false);
        }
    }, [refreshBalances]);

    const disconnectWallet = useCallback(() => {
        setConnected(false);
        setAddress('');
        setSeed('');
        if (refreshTimer.current) clearInterval(refreshTimer.current);
    }, []);

    const updateBalance = useCallback((tokenId, delta) => {
        setBalances(prev => ({
            ...prev,
            [tokenId]: Math.max(0, (prev[tokenId] || 0) + delta),
        }));
    }, []);

    const getBalance = useCallback((tokenId) => {
        return balances[tokenId] || 0;
    }, [balances]);

    return (
        <WalletContext.Provider value={{
            connected,
            connecting,
            address,
            seed,
            balances,
            connectWallet,
            disconnectWallet,
            updateBalance,
            getBalance,
            refreshBalances,
        }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWallet must be used within WalletProvider');
    return ctx;
}
