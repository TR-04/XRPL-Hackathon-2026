"""
Swap endpoints — quote + execute.
GET  /api/v1/swaps/quote
POST /api/v1/swaps/execute
"""
import logging

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel

from xrpl_service import get_quote, execute_swap, wallet_from_seed

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/swaps/quote")
async def swap_quote(
    request: Request,
    from_token: str = Query(..., alias="from"),
    to_token: str = Query(..., alias="to"),
    amount: float = Query(...),
):
    """
    Get a real-time swap quote.
    Uses AMM pool reserves for constant-product calculation.
    """
    issuer_addresses = request.app.state.issuer_addresses

    if from_token not in issuer_addresses or to_token not in issuer_addresses:
        raise HTTPException(status_code=400, detail=f"Unknown token in pair: {from_token}/{to_token}")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    result = get_quote(from_token, to_token, amount, issuer_addresses)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


class SwapRequest(BaseModel):
    from_token: str
    to_token: str
    amount: float
    wallet_seed: str


@router.post("/swaps/execute")
async def swap_execute(body: SwapRequest, request: Request):
    """
    Execute a swap on the XRPL.
    Uses cross-currency Payment with partial payment flag for AMM routing.
    """
    issuer_addresses = request.app.state.issuer_addresses

    if body.from_token not in issuer_addresses or body.to_token not in issuer_addresses:
        raise HTTPException(status_code=400, detail=f"Unknown token in pair")

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        user_wallet = wallet_from_seed(body.wallet_seed)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid wallet seed")

    try:
        result = execute_swap(user_wallet, body.from_token, body.to_token, body.amount, issuer_addresses)
    except Exception as e:
        logger.error(f"Swap failed: {e}")
        raise HTTPException(status_code=500, detail=f"Swap transaction failed: {str(e)}")

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Swap transaction was not validated on ledger")

    return {
        "tx_hash": result["tx_hash"],
        "from_token": body.from_token,
        "to_token": body.to_token,
        "amount_in": body.amount,
        "output_amount": result["output_amount"],
        "explorer": result["explorer"],
    }
