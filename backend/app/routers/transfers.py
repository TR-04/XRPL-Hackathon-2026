"""P2P transfer router — send tokens wallet-to-wallet."""

import logging
from fastapi import APIRouter, HTTPException

from app.config import BRANDS
from app.models import TransferRequest, TransferResponse
from app.xrpl_client import xrpl_manager

logger = logging.getLogger("loyaltyswap.transfers")
router = APIRouter(prefix="/api/v1/transfers", tags=["transfers"])


@router.post("/send", response_model=TransferResponse)
async def send_transfer(req: TransferRequest):
    """Send tokens from one wallet to another (P2P)."""
    if req.token not in BRANDS:
        raise HTTPException(status_code=400, detail=f"Unknown token: {req.token}")

    brand = BRANDS[req.token]
    issuer_wallet = xrpl_manager.issuer_wallets.get(req.token)

    if not issuer_wallet:
        raise HTTPException(status_code=503, detail="Issuer not initialized")

    try:
        sender_wallet = xrpl_manager.wallet_from_seed(req.from_seed)

        tx_hash = xrpl_manager.send_payment(
            sender_wallet=sender_wallet,
            destination=req.to_address,
            currency=brand["currency_code"],
            issuer=issuer_wallet.address,
            amount=str(req.amount),
            memo_text=req.memo,
        )

        return TransferResponse(
            tx_hash=tx_hash,
            token=req.token,
            amount=req.amount,
            to_address=req.to_address,
            explorer=xrpl_manager.get_explorer_link(tx_hash),
        )
    except Exception as e:
        logger.error(f"Transfer failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")
