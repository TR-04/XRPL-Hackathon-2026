"""
LoyaltySwap API Routes — All endpoints matching the PRD specification.
"""

import os
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger("loyaltyswap.routes")

router = APIRouter()


# ──────────────────────────────────────────────
# Request/Response Models 
# ──────────────────────────────────────────────

class ConnectRequest(BaseModel):
    address: str
    signature: Optional[str] = ""

class MintRequest(BaseModel):
    user_address: str
    amount: float
    qr_data: Optional[str] = ""
    user_seed: Optional[str] = ""

class SwapQuoteRequest(BaseModel):
    from_token: str
    to_token: str
    amount: float

class SwapExecuteRequest(BaseModel):
    from_token: str
    to_token: str
    amount: float
    wallet_seed: Optional[str] = ""

class TransferRequest(BaseModel):
    token: str
    amount: float
    to_address: str
    from_seed: Optional[str] = ""
    memo: Optional[str] = ""

class CreateWalletRequest(BaseModel):
    pass


# ──────────────────────────────────────────────
# Auth Endpoints
# ──────────────────────────────────────────────

@router.post("/api/v1/auth/connect")
async def auth_connect(req: ConnectRequest, request: Request):
    """Connect wallet and return JWT + balances."""
    xrpl = request.app.state.xrpl
    
    balances = await xrpl.get_balances(req.address)
    
    # Simple JWT for demo (in production, verify signature)
    from jose import jwt
    token = jwt.encode(
        {"address": req.address, "exp": datetime.utcnow() + timedelta(hours=24)},
        os.getenv("JWT_SECRET", "secret"),
        algorithm="HS256",
    )
    
    return {
        "jwt": token,
        "address": req.address,
        "balances": balances,
    }


# ──────────────────────────────────────────────
# Token Minting Endpoints
# ──────────────────────────────────────────────

@router.post("/api/v1/tokens/mint/{token}")
async def mint_token(token: str, req: MintRequest, request: Request):
    """Mint tokens from issuer to user. Matches PRD endpoint exactly."""
    xrpl = request.app.state.xrpl
    
    result = await xrpl.mint_tokens(
        currency=token,
        user_address=req.user_address,
        amount=req.amount,
        qr_data=req.qr_data or "",
        user_seed=req.user_seed or "",
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# ──────────────────────────────────────────────
# Swap Endpoints
# ──────────────────────────────────────────────

@router.get("/api/v1/swaps/quote")
async def swap_quote(request: Request):
    """
    Get a real-time swap quote. 
    Accepts query params like: ?mMacca=1000&to=mQantas
    or structured: ?from_token=mMacca&to_token=mQantas&amount=1000
    """
    xrpl = request.app.state.xrpl
    params = dict(request.query_params)
    
    # Support both query styles
    from_token = params.get("from_token", "")
    to_token = params.get("to_token", params.get("to", ""))
    amount = 0
    
    if from_token and to_token:
        amount = float(params.get("amount", 0))
    else:
        # Support ?mMacca=1000&to=mQantas style
        for key, val in params.items():
            if key.startswith("m") and key != "memo":
                from_token = key
                amount = float(val)
                break
    
    if not from_token or not to_token or amount <= 0:
        raise HTTPException(status_code=400, detail="Missing from_token, to_token, or amount")
    
    quote = await xrpl.get_quote(from_token, to_token, amount)
    
    if "error" in quote:
        raise HTTPException(status_code=400, detail=quote["error"])
    
    return quote


@router.post("/api/v1/swaps/execute")
async def swap_execute(req: SwapExecuteRequest, request: Request):
    """Execute a swap on XRPL Testnet."""
    xrpl = request.app.state.xrpl
    
    result = await xrpl.execute_swap(
        from_token=req.from_token,
        to_token=req.to_token,
        amount=req.amount,
        user_seed=req.wallet_seed or "",
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# ──────────────────────────────────────────────
# P2P Transfer Endpoint
# ──────────────────────────────────────────────

@router.post("/api/v1/transfers/send")
async def transfer_send(req: TransferRequest, request: Request):
    """Send tokens P2P between wallets."""
    xrpl = request.app.state.xrpl
    
    result = await xrpl.send_transfer(
        token=req.token,
        amount=req.amount,
        to_address=req.to_address,
        from_seed=req.from_seed or "",
        memo=req.memo or "",
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# ──────────────────────────────────────────────
# Wallet / Balance Endpoints
# ──────────────────────────────────────────────

@router.get("/api/v1/wallet/balances/{address}")
async def get_balances(address: str, request: Request):
    """Get all token balances for a wallet address."""
    xrpl = request.app.state.xrpl
    return await xrpl.get_balances(address)


@router.post("/api/v1/wallet/create")
async def create_wallet(request: Request):
    """Create a new funded testnet wallet with trustlines."""
    xrpl = request.app.state.xrpl
    return await xrpl.create_demo_wallet()


# ──────────────────────────────────────────────
# Pool / Token Info Endpoints
# ──────────────────────────────────────────────

@router.get("/api/v1/pools")
async def get_pools(request: Request):
    """Get all AMM pool information."""
    xrpl = request.app.state.xrpl
    return {"pools": xrpl.get_pool_info()}


@router.get("/api/v1/tokens")
async def get_tokens(request: Request):
    """Get all supported token metadata."""
    xrpl = request.app.state.xrpl
    return {"tokens": xrpl.get_token_info()}


@router.post("/api/v1/admin/create-amm-pools")
async def create_amm_pools(request: Request):
    """One-time: create actual AMM pools on XRPL Testnet."""
    xrpl = request.app.state.xrpl
    results = await xrpl.create_amm_pools_on_ledger()
    return {"results": results}


# ──────────────────────────────────────────────
# Protocol Revenue / Master Wallet
# ──────────────────────────────────────────────

@router.get("/api/v1/protocol/revenue")
async def protocol_revenue(request: Request):
    """Get master wallet address, balances, and protocol revenue stats."""
    xrpl = request.app.state.xrpl
    return await xrpl.get_master_balances()
