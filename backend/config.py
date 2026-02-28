"""
LoyaltySwap configuration — token definitions, XRPL constants.
"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

XRPL_TESTNET_URL = "https://s.altnet.rippletest.net:51234/"
XRPL_EXPLORER_BASE = "https://testnet.xrpl.org/transactions/"

# 7 loyalty tokens — matches the existing frontend exactly
TOKENS = {
    "mMacca": {
        "currency": "mMacca",  # 3-char+ currencies use hex on XRPL, handled in xrpl_service
        "name": "Macca's Rewards",
        "emoji": "🍔",
        "price_usd": 0.80,
        "initial_supply": 100_000,
        "pool_xrp": 40_000,  # XRP side of AMM pool
    },
    "mQantas": {
        "currency": "mQantas",
        "name": "Qantas Frequent Flyer",
        "emoji": "✈️",
        "price_usd": 1.00,
        "initial_supply": 100_000,
        "pool_xrp": 50_000,
    },
    "mWoolies": {
        "currency": "mWoolies",
        "name": "Woolworths Rewards",
        "emoji": "🛒",
        "price_usd": 0.65,
        "initial_supply": 100_000,
        "pool_xrp": 32_500,
    },
    "mGYG": {
        "currency": "mGYG",
        "name": "GYG Rewards",
        "emoji": "🌮",
        "price_usd": 0.45,
        "initial_supply": 100_000,
        "pool_xrp": 22_500,
    },
    "mJBHiFi": {
        "currency": "mJBHiFi",
        "name": "JB Hi-Fi Perks",
        "emoji": "🎧",
        "price_usd": 0.55,
        "initial_supply": 100_000,
        "pool_xrp": 27_500,
    },
    "mKmart": {
        "currency": "mKmart",
        "name": "Kmart Rewards",
        "emoji": "🏷️",
        "price_usd": 0.30,
        "initial_supply": 100_000,
        "pool_xrp": 15_000,
    },
    "mBoost": {
        "currency": "mBoost",
        "name": "Boost Vibe Club",
        "emoji": "🥤",
        "price_usd": 0.35,
        "initial_supply": 100_000,
        "pool_xrp": 17_500,
    },
}

TOKEN_LIST = list(TOKENS.keys())


def get_issuer_seed(token_id: str) -> str | None:
    """Get issuer wallet seed from environment."""
    return os.getenv(f"ISSUER_SEED_{token_id.upper()}")


def get_demo_wallet_seed() -> str | None:
    """Get the pre-funded demo wallet seed."""
    return os.getenv("DEMO_WALLET_SEED")
