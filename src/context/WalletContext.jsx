import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TOKENS } from '../data/tokens';
import api from '../services/api';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [connectStatus, setConnectStatus] = useState('');
    const [address, setAddress] = useState('');
    const [walletSeed, setWalletSeed] = useState('');
    const [xrpBalance, setXrpBalance] = useState('0');
    const [backendOnline, setBackendOnline] = useState(false);
    const [balances, setBalances] = useState(() => {
        const b = {};
        TOKENS.forEach(t => { b[t.id] = 0; });
        return b;
    });

    // Check backend health on mount
    useEffect(() => {
        api.health().then(data => {
            if (data && data.status) setBackendOnline(true);
        }).catch(() => setBackendOnline(false));
    }, []);

    const connectWallet = useCallback(async () => {
        setConnecting(true);
        try {
            // Step 1: Create a real funded testnet wallet with trustlines + initial tokens
            setConnectStatus('Creating XRPL wallet…');
            const walletData = await api.createWallet();
            if (!walletData || !walletData.address || !walletData.seed) {
                throw new Error('Wallet creation failed');
            }

            setAddress(walletData.address);
            setWalletSeed(walletData.seed);
            setConnectStatus('Fetching balances…');

            // Step 2: Connect (get JWT) and fetch real balances
            const result = await api.connect(walletData.address);
            if (result && result.jwt) {
                api.setJwt(result.jwt);
                if (result.balances) {
                    setXrpBalance(result.balances.xrp || '0');
                    const newBalances = {};
                    TOKENS.forEach(t => {
                        newBalances[t.id] = parseFloat(result.balances[t.id] || 0);
                    });
                    setBalances(newBalances);
                }
            }

            setConnected(true);
            setBackendOnline(true);
        } catch (e) {
            console.warn('Backend connect failed, using demo mode:', e.message);
            // Fallback: demo mode with mock data
            await new Promise(r => setTimeout(r, 1000));
            setAddress('rDemoFallback000000000000000000000');
            setXrpBalance('10.5');
            const demoBalances = {};
            TOKENS.forEach(t => { demoBalances[t.id] = t.userBalance; });
            setBalances(demoBalances);
            setConnected(true);
        }
        setConnectStatus('');
        setConnecting(false);
    }, []);

    const disconnectWallet = useCallback(() => {
        setConnected(false);
        setAddress('');
        setWalletSeed('');
        setXrpBalance('0');
        api.setJwt(null);
    }, []);

    const refreshBalances = useCallback(async () => {
        if (!address) return;
        try {
            const data = await api.getBalances(address);
            if (data) {
                setXrpBalance(data.xrp || '0');
                const newBalances = {};
                TOKENS.forEach(t => {
                    newBalances[t.id] = parseFloat(data[t.id] || 0);
                });
                setBalances(newBalances);
            }
        } catch (e) {
            console.warn('Balance refresh failed:', e.message);
        }
    }, [address]);

    const updateBalance = useCallback((tokenId, delta) => {
        setBalances(prev => ({
            ...prev,
            [tokenId]: Math.max(0, (prev[tokenId] || 0) + delta),
        }));
    }, []);

    const applyBalances = useCallback((rawBalances) => {
        if (!rawBalances || typeof rawBalances !== 'object') return;
        const newBalances = {};
        TOKENS.forEach(t => {
            newBalances[t.id] = parseFloat(rawBalances[t.id] || 0);
        });
        if (rawBalances.xrp) setXrpBalance(String(rawBalances.xrp));
        setBalances(newBalances);
    }, []);

    const getBalance = useCallback((tokenId) => {
        return balances[tokenId] || 0;
    }, [balances]);

    return (
        <WalletContext.Provider value={{
            connected,
            connecting,
            connectStatus,
            address,
            walletSeed,
            xrpBalance,
            balances,
            backendOnline,
            connectWallet,
            disconnectWallet,
            updateBalance,
            applyBalances,
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
