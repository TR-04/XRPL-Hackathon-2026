"""
Token minting endpoints.
POST /api/v1/tokens/mint/{token_id}
"""
import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from xrpl_service import mint_token

logger = logging.getLogger(__name__)

router = APIRouter()


class MintRequest(BaseModel):
    user_address: str
    amount: float
    qr_data: str | None = None


@router.post("/tokens/mint/{token_id}")
async def mint(token_id: str, body: MintRequest, request: Request):
    """
    Mint loyalty tokens from the issuer wallet to a user.
    This simulates the QR scan → mint flow.
    """
    issuer_wallets = request.app.state.issuer_wallets

    if token_id not in issuer_wallets:
        raise HTTPException(status_code=404, detail=f"Unknown token: {token_id}. Have you run setup_testnet.py?")

    issuer_w = issuer_wallets[token_id]

    try:
        result = await mint_token(issuer_w, body.user_address, token_id, body.amount)
    except Exception as e:
        logger.error(f"Mint failed for {token_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Mint transaction failed: {str(e)}")

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Mint transaction was not validated on ledger")

    return {
        "tx_hash": result["tx_hash"],
        "token": token_id,
        "amount": body.amount,
        "explorer": result["explorer"],
    }
