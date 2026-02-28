import { createContext, useContext, useState, useCallback } from 'react';
import { TOKENS } from '../data/tokens';

const WalletContext = createContext(null);

const MOCK_ADDRESS = 'rLoyaLSwaP4xRPL2026sYdNeYhAcKaThOn';

export function WalletProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [address, setAddress] = useState('');
    const [balances, setBalances] = useState(() => {
        const b = {};
        TOKENS.forEach(t => { b[t.id] = t.userBalance; });
        return b;
    });

    const connectWallet = useCallback(async () => {
        setConnecting(true);
        // Simulate Xaman wallet connection
        await new Promise(r => setTimeout(r, 1500));
        setAddress(MOCK_ADDRESS);
        setConnected(true);
        setConnecting(false);
    }, []);

    const disconnectWallet = useCallback(() => {
        setConnected(false);
        setAddress('');
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
            balances,
            connectWallet,
            disconnectWallet,
            updateBalance,
            getBalance,
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
