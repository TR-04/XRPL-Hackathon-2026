"""
LoyaltySwap — FastAPI Backend

Main application entry point. Mounts all routers and provides health check.
On startup, attempts to load saved wallets or runs testnet setup.
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import HealthResponse
from app.xrpl_client import xrpl_manager
from app.setup_testnet import load_wallets_from_file, setup_testnet
from app.routers import auth, tokens, swaps, transfers, wallet

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger("loyaltyswap")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load wallets or run testnet setup."""
    logger.info("🚀 LoyaltySwap backend starting...")

    # Try to load existing wallets
    loaded = load_wallets_from_file()
    if not loaded:
        logger.info("No saved wallets found. Checking SETUP_ON_START env var...")
        if os.environ.get("SETUP_ON_START", "").lower() == "true":
            logger.info("Running full testnet setup (this takes ~2 minutes)...")
            setup_testnet()
        else:
            logger.info(
                "Skipping auto-setup. Run `python -m app.setup_testnet` manually, "
                "or set SETUP_ON_START=true."
            )

    logger.info(f"✅ Backend ready — {len(xrpl_manager.issuer_wallets)} issuers, {xrpl_manager.pool_count} pools")
    yield
    logger.info("👋 LoyaltySwap backend shutting down.")


app = FastAPI(
    title="LoyaltySwap API",
    description="Swap loyalty points across brands using XRPL AMM pools",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(tokens.router)
app.include_router(swaps.router)
app.include_router(transfers.router)
app.include_router(wallet.router)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check — returns XRPL connection status and pool count."""
    connected = xrpl_manager.is_connected
    return HealthResponse(
        status="healthy" if connected else "degraded",
        xrpl_connected=connected,
        pools=xrpl_manager.pool_count,
        network="testnet",
    )


@app.get("/api/v1/config/brands")
async def get_brands():
    """Return brand configuration for the frontend."""
    from app.config import BRANDS
    brands_out = {}
    for name, info in BRANDS.items():
        issuer = xrpl_manager.issuer_wallets.get(name)
        brands_out[name] = {
            **info,
            "issuer_address": issuer.address if issuer else None,
        }
    return brands_out
