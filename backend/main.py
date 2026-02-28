"""
LoyaltySwap — FastAPI backend entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import TOKENS, get_issuer_seed
from xrpl_service import get_client, is_connected, wallet_from_seed

from routers import health, auth, tokens, swaps, transfers, wallet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── App state (populated on startup) ────────────────────────────────────────

issuer_wallets: dict = {}
issuer_addresses: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to XRPL, load issuer wallets."""
    logger.info("Starting LoyaltySwap backend…")

    # Initialise XRPL client
    client = get_client()
    connected = await is_connected()
    logger.info(f"XRPL testnet connected: {connected}")

    # Load issuer wallets from .env seeds
    for token_id in TOKENS:
        seed = get_issuer_seed(token_id)
        if seed:
            w = wallet_from_seed(seed)
            issuer_wallets[token_id] = w
            issuer_addresses[token_id] = w.address
            logger.info(f"  ✓ Loaded issuer for {token_id}: {w.address}")
        else:
            logger.warning(f"  ✗ No seed found for {token_id} — run setup_testnet.py first")

    # Store in app state so routers can access
    app.state.issuer_wallets = issuer_wallets
    app.state.issuer_addresses = issuer_addresses

    yield

    logger.info("Shutting down LoyaltySwap backend.")


# ─── Create app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="LoyaltySwap API",
    description="XRPL-powered loyalty point exchange",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server & any localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(tokens.router, prefix="/api/v1")
app.include_router(swaps.router, prefix="/api/v1")
app.include_router(transfers.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")
