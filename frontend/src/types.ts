/** LoyaltySwap TypeScript type definitions */

export interface Brand {
    currency_code: string;
    emoji: string;
    color: string;
    mock_price_usd: number;
    display_name: string;
    issuer_address: string | null;
}

export interface Brands {
    [key: string]: Brand;
}

export interface WalletState {
    connected: boolean;
    address: string;
    seed: string;
    jwt: string;
    balances: Record<string, string>;
}

export interface QuoteResponse {
    input: string;
    output: string;
    input_amount: number;
    output_amount: number;
    price_impact: number;
    path: string[];
    expires_in: number;
}

export interface SwapResponse {
    tx_hash: string;
    from_token: string;
    to_token: string;
    input_amount: number;
    output_amount: number;
    explorer: string;
}

export interface MintResponse {
    tx_hash: string;
    token: string;
    amount: number;
    explorer: string;
}

export interface TransferResponse {
    tx_hash: string;
    token: string;
    amount: number;
    to_address: string;
    explorer: string;
}

export interface TransactionResult {
    type: 'mint' | 'swap' | 'transfer';
    tx_hash: string;
    explorer: string;
    details: string;
}
