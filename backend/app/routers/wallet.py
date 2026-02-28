"""Wallet balance query router."""

import logging
from fastapi import APIRouter, HTTPException

from app.models import BalancesResponse
from app.xrpl_client import xrpl_manager

logger = logging.getLogger("loyaltyswap.wallet")
router = APIRouter(prefix="/api/v1/wallet", tags=["wallet"])


@router.get("/balances/{address}", response_model=BalancesResponse)
async def get_balances(address: str):
    """Get all token balances + XRP for a given wallet address."""
    if not address.startswith("r"):
        raise HTTPException(status_code=400, detail="Invalid XRPL address")

    try:
        balances = xrpl_manager.get_balances(address)
        return BalancesResponse(address=address, balances=balances)
    except Exception as e:
        logger.error(f"Balance query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Balance query failed: {str(e)}")
