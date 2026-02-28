/**
 * LoyaltySwap API Service Layer
 * Connects React frontend to FastAPI backend at localhost:8000
 */

// In Docker, the browser still talks to localhost — the backend port is exposed.
// Override via VITE_API_URL env var if needed.
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE;
        this.jwt = null;
    }

    setJwt(token) {
        this.jwt = token;
    }

    _headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.jwt) h['Authorization'] = `Bearer ${this.jwt}`;
        return h;
    }

    async _fetch(url, options = {}) {
        try {
            const resp = await fetch(`${this.baseUrl}${url}`, {
                ...options,
                headers: { ...this._headers(), ...(options.headers || {}) },
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ detail: resp.statusText }));
                throw new Error(err.detail || `API Error ${resp.status}`);
            }
            return resp.json();
        } catch (e) {
            if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
                console.warn('Backend not available, using local fallback');
                return null;
            }
            throw e;
        }
    }

    // ── Health ──────────────────────────────
    async health() {
        return this._fetch('/health');
    }

    // ── Auth ────────────────────────────────
    async connect(address, signature = '') {
        return this._fetch('/api/v1/auth/connect', {
            method: 'POST',
            body: JSON.stringify({ address, signature }),
        });
    }

    // ── Balances ────────────────────────────
    async getBalances(address) {
        return this._fetch(`/api/v1/wallet/balances/${address}`);
    }

    // ── Swap Quote ──────────────────────────
    async getQuote(fromToken, toToken, amount) {
        const params = new URLSearchParams({
            from_token: fromToken,
            to_token: toToken,
            amount: amount.toString(),
        });
        return this._fetch(`/api/v1/swaps/quote?${params}`);
    }

    // ── Swap Execute ────────────────────────
    async executeSwap(fromToken, toToken, amount, walletSeed = '') {
        return this._fetch('/api/v1/swaps/execute', {
            method: 'POST',
            body: JSON.stringify({
                from_token: fromToken,
                to_token: toToken,
                amount,
                wallet_seed: walletSeed,
            }),
        });
    }

    // ── Mint Tokens ─────────────────────────
    async mintToken(token, userAddress, amount, qrData = '', userSeed = '') {
        return this._fetch(`/api/v1/tokens/mint/${token}`, {
            method: 'POST',
            body: JSON.stringify({
                user_address: userAddress,
                amount,
                qr_data: qrData,
                user_seed: userSeed,
            }),
        });
    }

    // ── P2P Transfer ────────────────────────
    async sendTransfer(token, amount, toAddress, fromSeed = '', memo = '') {
        return this._fetch('/api/v1/transfers/send', {
            method: 'POST',
            body: JSON.stringify({
                token,
                amount,
                to_address: toAddress,
                from_seed: fromSeed,
                memo,
            }),
        });
    }

    // ── Create Demo Wallet ──────────────────
    async createWallet() {
        return this._fetch('/api/v1/wallet/create', { method: 'POST' });
    }

    // ── Pool / Token Info ───────────────────
    async getPools() {
        return this._fetch('/api/v1/pools');
    }

    async getTokens() {
        return this._fetch('/api/v1/tokens');
    }

    // ── Protocol Revenue / Master Wallet ────
    async getProtocolRevenue() {
        return this._fetch('/api/v1/protocol/revenue');
    }
}

// Singleton export
const api = new ApiService();
export default api;
