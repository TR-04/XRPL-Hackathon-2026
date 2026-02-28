"""Token minting router — mint loyalty tokens to user wallets."""

import logging
from fastapi import APIRouter, HTTPException

from app.config import BRANDS
from app.models import MintRequest, MintResponse
from app.xrpl_client import xrpl_manager

logger = logging.getLogger("loyaltyswap.tokens")
router = APIRouter(prefix="/api/v1/tokens", tags=["tokens"])


@router.post("/mint/{token_name}", response_model=MintResponse)
async def mint_token(token_name: str, req: MintRequest):
    """
    Mint loyalty tokens from issuer wallet to user wallet.
    Simulates a QR code scan at a brand partner store.
    """
    if token_name not in BRANDS:
        raise HTTPException(status_code=400, detail=f"Unknown token: {token_name}")

    brand = BRANDS[token_name]
    issuer_wallet = xrpl_manager.issuer_wallets.get(token_name)

    if not issuer_wallet:
        raise HTTPException(
            status_code=503,
            detail=f"Issuer wallet for {token_name} not initialized. Run setup first.",
        )

    try:
        tx_hash = xrpl_manager.send_payment(
            sender_wallet=issuer_wallet,
            destination=req.user_address,
            currency=brand["currency_code"],
            issuer=issuer_wallet.address,
            amount=str(req.amount),
        )

        return MintResponse(
            tx_hash=tx_hash,
            token=token_name,
            amount=req.amount,
            explorer=xrpl_manager.get_explorer_link(tx_hash),
        )
    except Exception as e:
        logger.error(f"Mint failed for {token_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Mint failed: {str(e)}")
