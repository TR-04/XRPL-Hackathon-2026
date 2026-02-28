"""
LoyaltySwap Backend — FastAPI + xrpl-py
Connects to XRPL Testnet for real on-ledger transactions.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from xrpl_client import XRPLManager
from routes import router

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("loyaltyswap")

xrpl_manager = XRPLManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to XRPL, create issuer wallets, seed AMM pools."""
    logger.info("🚀 Starting LoyaltySwap backend...")
    await xrpl_manager.initialize()
    app.state.xrpl = xrpl_manager
    logger.info("✅ LoyaltySwap backend ready!")
    yield
    logger.info("👋 Shutting down LoyaltySwap backend...")


app = FastAPI(
    title="LoyaltySwap API",
    description="XRPL-powered loyalty token exchange",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health():
    connected = xrpl_manager.connected
    pool_count = len(xrpl_manager.amm_pools) if xrpl_manager.amm_pools else 0
    return {
        "status": "healthy" if connected else "degraded",
        "xrpl_connected": connected,
        "pools": pool_count,
        "network": "testnet",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
