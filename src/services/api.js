/**
 * LoyaltySwap API service layer.
 * All backend calls to localhost:8000 go through here.
 */

const API_BASE = '/api/v1';

async function apiFetch(path, options = {}) {
    const url = path.startsWith('/health') ? path : `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `API error ${res.status}`);
    }
    return res.json();
}

/** Health check */
export function checkHealth() {
    return apiFetch('/health');
}

/** Connect wallet — returns { address, seed, balances } */
export function connectWalletAPI() {
    return apiFetch('/auth/connect', {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

/** Get balances for an address */
export function getBalances(address) {
    return apiFetch(`/wallet/balances/${address}`);
}

/** Get swap quote */
export function getSwapQuote(fromToken, toToken, amount) {
    const params = new URLSearchParams({ from: fromToken, to: toToken, amount: String(amount) });
    return apiFetch(`/swaps/quote?${params}`);
}

/** Execute swap */
export function executeSwap(fromToken, toToken, amount, walletSeed) {
    return apiFetch('/swaps/execute', {
        method: 'POST',
        body: JSON.stringify({
            from_token: fromToken,
            to_token: toToken,
            amount,
            wallet_seed: walletSeed,
        }),
    });
}

/** Mint tokens (on-ramp) */
export function mintToken(tokenId, userAddress, amount, qrData = null) {
    return apiFetch(`/tokens/mint/${tokenId}`, {
        method: 'POST',
        body: JSON.stringify({
            user_address: userAddress,
            amount,
            qr_data: qrData,
        }),
    });
}

/** P2P token transfer */
export function sendTransfer(token, amount, toAddress, walletSeed, memo = null) {
    return apiFetch('/transfers/send', {
        method: 'POST',
        body: JSON.stringify({
            token,
            amount,
            to_address: toAddress,
            wallet_seed: walletSeed,
            memo,
        }),
    });
}
