import { TOKENS } from './tokens';

// Generate AMM pools — each token paired with XRP
export const POOLS = TOKENS.map(token => ({
    id: `${token.id}-XRP`,
    tokenA: token.id,
    tokenB: 'XRP',
    reserveA: Math.round(token.totalSupply * 0.15),
    reserveB: Math.round(token.totalSupply * 0.15 * token.price / 0.50), // XRP at ~$0.50
    fee: 0.003, // 0.3%
    volume24h: Math.round(Math.random() * 50000 + 10000),
    tvl: Math.round(token.totalSupply * 0.15 * token.price * 2),
    apy: (Math.random() * 8 + 2).toFixed(1),
}));

/**
 * Constant product AMM: x * y = k
 * Returns output amount given input amount and reserves
 */
export function getAmountOut(amountIn, reserveIn, reserveOut, fee = 0.003) {
    if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) return 0;
    const amountInWithFee = amountIn * (1 - fee);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    return numerator / denominator;
}

/**
 * Get a swap quote for any token pair (routes through XRP if needed)
 */
export function getQuote(fromTokenId, toTokenId, amountIn) {
    if (fromTokenId === toTokenId || amountIn <= 0) {
        return { amountOut: 0, path: [], priceImpact: 0, fee: 0 };
    }

    const poolFrom = POOLS.find(p => p.tokenA === fromTokenId);
    const poolTo = POOLS.find(p => p.tokenA === toTokenId);

    if (!poolFrom || !poolTo) {
        return { amountOut: 0, path: [], priceImpact: 0, fee: 0 };
    }

    // Route: fromToken → XRP → toToken
    const xrpOut = getAmountOut(amountIn, poolFrom.reserveA, poolFrom.reserveB);
    const tokenOut = getAmountOut(xrpOut, poolTo.reserveB, poolTo.reserveA);

    const expectedOut = amountIn * (poolFrom.reserveB / poolFrom.reserveA) * (poolTo.reserveA / poolTo.reserveB);
    const priceImpact = expectedOut > 0 ? Math.abs((expectedOut - tokenOut) / expectedOut) * 100 : 0;
    const totalFee = amountIn * 0.003 * 2; // Two hops

    return {
        amountOut: Math.round(tokenOut * 100) / 100,
        path: [fromTokenId, 'XRP', toTokenId],
        priceImpact: Math.round(priceImpact * 100) / 100,
        fee: Math.round(totalFee * 100) / 100,
        rate: tokenOut / amountIn,
        xrpIntermediate: Math.round(xrpOut * 100) / 100,
    };
}

/**
 * Generate a mock transaction hash
 */
export function generateTxHash() {
    const chars = '0123456789ABCDEF';
    let hash = '';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

export function getPool(tokenId) {
    return POOLS.find(p => p.tokenA === tokenId);
}
