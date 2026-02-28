"""
Wallet balance endpoint.
GET /api/v1/wallet/balances/{address}
"""
from fastapi import APIRouter, Request

from xrpl_service import get_all_balances

router = APIRouter()


@router.get("/wallet/balances/{address}")
async def get_balances(address: str, request: Request):
    """Get all token + XRP balances for an XRPL address."""
    issuer_addresses = request.app.state.issuer_addresses
    balances = await get_all_balances(address, issuer_addresses)
    return balances
