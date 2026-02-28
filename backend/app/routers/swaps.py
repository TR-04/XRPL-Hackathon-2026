"""Swap router — quotes and execution via XRPL AMM + pathfinding."""

import logging
import math
from fastapi import APIRouter, HTTPException, Query

from app.config import BRANDS, POOL_SEED_TOKEN_AMOUNT, POOL_SEED_XRP_AMOUNT
from app.models import QuoteResponse, SwapRequest, SwapResponse
from app.xrpl_client import xrpl_manager

logger = logging.getLogger("loyaltyswap.swaps")
router = APIRouter(prefix="/api/v1/swaps", tags=["swaps"])


def _estimate_swap(from_token: str, to_token: str, amount: float) -> dict:
    """
    Estimate swap output using constant-product AMM math.
    Path: fromToken → XRP → toToken (two-hop via XRP bridge).
    """
    from_brand = BRANDS.get(from_token)
    to_brand = BRANDS.get(to_token)
    if not from_brand or not to_brand:
        raise ValueError(f"Unknown token pair: {from_token}/{to_token}")

    # Reserves (using seed amounts as base; in production, query on-chain)
    from_reserve_token = POOL_SEED_TOKEN_AMOUNT
    from_reserve_xrp = POOL_SEED_XRP_AMOUNT

    to_reserve_token = POOL_SEED_TOKEN_AMOUNT
    to_reserve_xrp = POOL_SEED_XRP_AMOUNT

    fee = 0.005  # 0.5% AMM fee per hop

    # Hop 1: fromToken → XRP (sell fromToken, get XRP)
    amount_in_after_fee = amount * (1 - fee)
    xrp_out = (from_reserve_xrp * amount_in_after_fee) / (from_reserve_token + amount_in_after_fee)

    # Hop 2: XRP → toToken (sell XRP, get toToken)
    xrp_in_after_fee = xrp_out * (1 - fee)
    token_out = (to_reserve_token * xrp_in_after_fee) / (to_reserve_xrp + xrp_in_after_fee)

    # Price impact (simplified)
    ideal_rate = from_brand["mock_price_usd"] / to_brand["mock_price_usd"]
    actual_rate = token_out / amount if amount > 0 else 0
    price_impact = abs(1 - actual_rate / ideal_rate) * 100 if ideal_rate > 0 else 0

    return {
        "output_amount": round(token_out, 2),
        "price_impact": round(price_impact, 2),
        "path": [from_token, "XRP", to_token],
    }


@router.get("/quote", response_model=QuoteResponse)
async def get_quote(
    from_token: str = Query(..., alias="from"),
    to_token: str = Query(..., alias="to"),
    amount: float = Query(...),
):
    """Get a real-time swap quote using AMM constant-product math."""
    if from_token not in BRANDS:
        raise HTTPException(status_code=400, detail=f"Unknown from token: {from_token}")
    if to_token not in BRANDS:
        raise HTTPException(status_code=400, detail=f"Unknown to token: {to_token}")
    if from_token == to_token:
        raise HTTPException(status_code=400, detail="Cannot swap same token")

    try:
        estimate = _estimate_swap(from_token, to_token, amount)
        return QuoteResponse(
            input=from_token,
            output=to_token,
            input_amount=amount,
            output_amount=estimate["output_amount"],
            price_impact=estimate["price_impact"],
            path=estimate["path"],
            expires_in=30,
        )
    except Exception as e:
        logger.error(f"Quote failed: {e}")
        raise HTTPException(status_code=500, detail=f"Quote failed: {str(e)}")


@router.post("/execute", response_model=SwapResponse)
async def execute_swap(req: SwapRequest):
    """Execute a real swap via XRPL cross-currency payment with pathfinding."""
    if req.from_token not in BRANDS or req.to_token not in BRANDS:
        raise HTTPException(status_code=400, detail="Unknown token")

    from_brand = BRANDS[req.from_token]
    to_brand = BRANDS[req.to_token]

    from_issuer = xrpl_manager.issuer_wallets.get(req.from_token)
    to_issuer = xrpl_manager.issuer_wallets.get(req.to_token)

    if not from_issuer or not to_issuer:
        raise HTTPException(status_code=503, detail="Issuer wallets not initialized")

    try:
        wallet = xrpl_manager.wallet_from_seed(req.wallet_seed)

        result = xrpl_manager.cross_currency_payment(
            sender_wallet=wallet,
            from_currency=from_brand["currency_code"],
            from_issuer=from_issuer.address,
            to_currency=to_brand["currency_code"],
            to_issuer=to_issuer.address,
            send_amount=str(req.amount),
        )

        return SwapResponse(
            tx_hash=result["tx_hash"],
            from_token=req.from_token,
            to_token=req.to_token,
            input_amount=req.amount,
            output_amount=float(result["output_amount"]),
            explorer=xrpl_manager.get_explorer_link(result["tx_hash"]),
        )
    except Exception as e:
        logger.error(f"Swap execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Swap failed: {str(e)}")
