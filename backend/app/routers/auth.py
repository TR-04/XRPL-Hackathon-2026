"""Auth router — wallet connect for demo."""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter
from jose import jwt

from app.config import JWT_SECRET, JWT_ALGORITHM, BRANDS
from app.models import ConnectRequest, ConnectResponse
from app.xrpl_client import xrpl_manager

logger = logging.getLogger("loyaltyswap.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# In-memory user wallet store (demo only)
user_wallets: dict = {}


@router.post("/connect", response_model=ConnectResponse)
async def connect_wallet(req: ConnectRequest):
    """
    Connect or create a demo wallet.
    If address provided and known, return existing wallet.
    Otherwise create a new testnet wallet via faucet.
    """
    if req.address and req.address in user_wallets:
        wallet_info = user_wallets[req.address]
        seed = wallet_info["seed"]
        wallet = xrpl_manager.wallet_from_seed(seed)
    else:
        wallet = xrpl_manager.create_funded_wallet()
        seed = wallet.seed

        # Set up trustlines for all 7 tokens
        for brand_name, brand_info in BRANDS.items():
            issuer_wallet = xrpl_manager.issuer_wallets.get(brand_name)
            if issuer_wallet:
                try:
                    xrpl_manager.set_trustline(
                        wallet,
                        brand_info["currency_code"],
                        issuer_wallet.address,
                    )
                except Exception as e:
                    logger.warning(f"Trustline for {brand_name} failed: {e}")

        user_wallets[wallet.address] = {"seed": seed}

    # Get balances
    balances = xrpl_manager.get_balances(wallet.address)

    # Issue JWT
    token_data = {
        "sub": wallet.address,
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    jwt_token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return ConnectResponse(
        jwt=jwt_token,
        address=wallet.address,
        seed=seed,
        balances=balances,
    )
