"""Pydantic models for LoyaltySwap API request / response schemas."""

from pydantic import BaseModel
from typing import Optional, Dict


# ── Auth ────────────────────────────────────────────────────────────
class ConnectRequest(BaseModel):
    address: Optional[str] = None
    signature: Optional[str] = None


class ConnectResponse(BaseModel):
    jwt: str
    address: str
    seed: str  # Exposed for demo only — custodial hackathon wallet
    balances: Dict[str, str]


# ── Token Minting ───────────────────────────────────────────────────
class MintRequest(BaseModel):
    user_address: str
    amount: float
    qr_data: Optional[str] = "mock_qr_scan"


class MintResponse(BaseModel):
    tx_hash: str
    token: str
    amount: float
    explorer: str


# ── Swap Quote ──────────────────────────────────────────────────────
class QuoteResponse(BaseModel):
    input: str
    output: str
    input_amount: float
    output_amount: float
    price_impact: float
    path: list[str]
    expires_in: int = 30


# ── Swap Execution ──────────────────────────────────────────────────
class SwapRequest(BaseModel):
    from_token: str
    to_token: str
    amount: float
    wallet_seed: str


class SwapResponse(BaseModel):
    tx_hash: str
    from_token: str
    to_token: str
    input_amount: float
    output_amount: float
    explorer: str


# ── P2P Transfer ────────────────────────────────────────────────────
class TransferRequest(BaseModel):
    token: str
    amount: float
    to_address: str
    from_seed: str
    memo: Optional[str] = ""


class TransferResponse(BaseModel):
    tx_hash: str
    token: str
    amount: float
    to_address: str
    explorer: str


# ── Balances ────────────────────────────────────────────────────────
class BalancesResponse(BaseModel):
    address: str
    balances: Dict[str, str]


# ── Health ──────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    xrpl_connected: bool
    pools: int
    network: str
