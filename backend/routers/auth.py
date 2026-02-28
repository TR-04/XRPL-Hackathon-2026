"""
Auth / wallet connection endpoint.
For the hackathon demo, this generates a new testnet wallet or returns
the pre-seeded demo wallet from .env.
"""
import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel

from config import get_demo_wallet_seed, TOKENS, get_issuer_seed
from xrpl_service import (
    wallet_from_seed,
    get_all_balances,
    set_trustline,
    get_client,
)
from xrpl.wallet import generate_faucet_wallet

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectRequest(BaseModel):
    address: str | None = None
    signature: str | None = None


@router.post("/auth/connect")
async def connect_wallet(body: ConnectRequest, request: Request):
    """
    Connect a wallet for the demo.
    - If a demo wallet seed exists in .env → use it
    - Otherwise → generate a new testnet wallet from faucet
    """
    issuer_addresses = request.app.state.issuer_addresses

    demo_seed = get_demo_wallet_seed()
    if demo_seed and demo_seed != "sEdXXX...":
        # Use pre-seeded demo wallet
        w = wallet_from_seed(demo_seed)
        logger.info(f"Using demo wallet: {w.address}")
    else:
        # Generate new wallet from faucet
        logger.info("Generating new testnet wallet from faucet…")
        client = get_client()
        w = generate_faucet_wallet(client, debug=True)
        logger.info(f"New wallet: {w.address}")

        # Set up trustlines for all 7 tokens
        for token_id in TOKENS:
            issuer_addr = issuer_addresses.get(token_id)
            if issuer_addr:
                try:
                    result = set_trustline(w, token_id, issuer_addr)
                    logger.info(f"  Trustline {token_id}: {'✓' if result['success'] else '✗'}")
                except Exception as e:
                    logger.error(f"  Trustline {token_id} failed: {e}")

    # Get balances
    balances = get_all_balances(w.address, issuer_addresses)

    return {
        "address": w.address,
        "seed": w.seed,  # For hackathon demo only — lets frontend sign txs
        "balances": balances,
    }
