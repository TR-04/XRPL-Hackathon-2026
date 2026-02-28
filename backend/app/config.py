"""LoyaltySwap configuration — 7 brand tokens on XRPL Testnet."""

XRPL_TESTNET_URL = "https://s.altnet.rippletest.net:51234/"
XRPL_EXPLORER_BASE = "https://testnet.xrpl.org/transactions/"

JWT_SECRET = "loyaltyswap-hackathon-demo-secret-key"
JWT_ALGORITHM = "HS256"

# ── 7 Loyalty Brands ────────────────────────────────────────────────
# currency_code must be 3 chars for standard XRPL issued currencies
BRANDS = {
    "mMacca": {
        "currency_code": "MAC",
        "emoji": "🍔",
        "color": "#FF2D08",
        "mock_price_usd": 0.80,
        "display_name": "McDonald's Points",
    },
    "mQantas": {
        "currency_code": "QAN",
        "emoji": "✈️",
        "color": "#E4002B",
        "mock_price_usd": 1.00,
        "display_name": "Qantas Frequent Flyer",
    },
    "mJetstar": {
        "currency_code": "JET",
        "emoji": "🛩️",
        "color": "#FF6600",
        "mock_price_usd": 0.95,
        "display_name": "Jetstar Points",
    },
    "mGYG": {
        "currency_code": "GYG",
        "emoji": "🌮",
        "color": "#FFD700",
        "mock_price_usd": 0.45,
        "display_name": "Guzman y Gomez Rewards",
    },
    "mApple": {
        "currency_code": "APL",
        "emoji": "🍎",
        "color": "#A2AAAD",
        "mock_price_usd": 2.50,
        "display_name": "Apple Rewards",
    },
    "mMS": {
        "currency_code": "MSF",
        "emoji": "💻",
        "color": "#00A4EF",
        "mock_price_usd": 0.10,
        "display_name": "Microsoft Rewards",
    },
    "mWoolies": {
        "currency_code": "WOL",
        "emoji": "🛒",
        "color": "#125F1A",
        "mock_price_usd": 0.02,
        "display_name": "Woolworths Everyday Rewards",
    },
}

# Pool seed amounts (in drops for XRP side, token units for token side)
POOL_SEED_TOKEN_AMOUNT = 100_000
POOL_SEED_XRP_AMOUNT = 100  # XRP

# All brand names for iteration
BRAND_NAMES = list(BRANDS.keys())
