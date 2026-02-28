/** API Client — wrapper for all backend calls */

const API_BASE = 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'API error');
    }
    return res.json();
}

export const api = {
    // Health
    health: () => request<{ status: string; xrpl_connected: boolean; pools: number }>('/health'),

    // Auth
    connectWallet: () =>
        request<{ jwt: string; address: string; seed: string; balances: Record<string, string> }>(
            '/api/v1/auth/connect',
            { method: 'POST', body: JSON.stringify({}) }
        ),

    // Brands config
    getBrands: () => request<Record<string, any>>('/api/v1/config/brands'),

    // Balances
    getBalances: (address: string) =>
        request<{ address: string; balances: Record<string, string> }>(`/api/v1/wallet/balances/${address}`),

    // Token minting
    mintToken: (tokenName: string, userAddress: string, amount: number) =>
        request<{ tx_hash: string; token: string; amount: number; explorer: string }>(
            `/api/v1/tokens/mint/${tokenName}`,
            { method: 'POST', body: JSON.stringify({ user_address: userAddress, amount, qr_data: 'demo_qr' }) }
        ),

    // Swap quote
    getQuote: (from: string, to: string, amount: number) =>
        request<{ input: string; output: string; input_amount: number; output_amount: number; price_impact: number; path: string[]; expires_in: number }>(
            `/api/v1/swaps/quote?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`
        ),

    // Swap execute
    executeSwap: (fromToken: string, toToken: string, amount: number, walletSeed: string) =>
        request<{ tx_hash: string; from_token: string; to_token: string; input_amount: number; output_amount: number; explorer: string }>(
            '/api/v1/swaps/execute',
            { method: 'POST', body: JSON.stringify({ from_token: fromToken, to_token: toToken, amount, wallet_seed: walletSeed }) }
        ),

    // P2P transfer
    sendTransfer: (token: string, amount: number, toAddress: string, fromSeed: string, memo?: string) =>
        request<{ tx_hash: string; token: string; amount: number; to_address: string; explorer: string }>(
            '/api/v1/transfers/send',
            { method: 'POST', body: JSON.stringify({ token, amount, to_address: toAddress, from_seed: fromSeed, memo: memo || '' }) }
        ),
};
