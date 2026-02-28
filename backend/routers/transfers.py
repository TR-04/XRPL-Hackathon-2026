"""
P2P transfer endpoint.
POST /api/v1/transfers/send
"""
import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from xrpl_service import send_p2p, wallet_from_seed

logger = logging.getLogger(__name__)

router = APIRouter()


class TransferRequest(BaseModel):
    token: str
    amount: float
    to_address: str
    wallet_seed: str
    memo: str | None = None


@router.post("/transfers/send")
async def send_transfer(body: TransferRequest, request: Request):
    """Send tokens to another XRPL address (P2P transfer)."""
    issuer_addresses = request.app.state.issuer_addresses

    if body.token not in issuer_addresses:
        raise HTTPException(status_code=400, detail=f"Unknown token: {body.token}")

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        sender_wallet = wallet_from_seed(body.wallet_seed)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid wallet seed")

    issuer_addr = issuer_addresses[body.token]

    try:
        result = await send_p2p(sender_wallet, body.to_address, body.token, body.amount, issuer_addr)
    except Exception as e:
        logger.error(f"Transfer failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transfer transaction failed: {str(e)}")

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Transfer was not validated on ledger")

    return {
        "tx_hash": result["tx_hash"],
        "token": body.token,
        "amount": body.amount,
        "to_address": body.to_address,
        "explorer": result["explorer"],
    }
