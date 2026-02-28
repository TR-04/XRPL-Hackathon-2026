"""
XRPL service layer — all direct XRPL ledger interactions.
Uses xrpl-py following the official tutorials exactly.
"""
import logging
from typing import Any

from xrpl.clients import JsonRpcClient
from xrpl.models import (
    AccountInfo,
    AccountLines,
    AMMInfo,
    IssuedCurrencyAmount,
    Payment,
    TrustSet,
)
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops
from xrpl.wallet import Wallet

from config import TOKENS, XRPL_TESTNET_URL, XRPL_EXPLORER_BASE

logger = logging.getLogger(__name__)

# ─── Singleton client ────────────────────────────────────────────────────────

_client: JsonRpcClient | None = None


def get_client() -> JsonRpcClient:
    """Return the XRPL JSON-RPC client (singleton)."""
    global _client
    if _client is None:
        _client = JsonRpcClient(XRPL_TESTNET_URL)
    return _client


def is_connected() -> bool:
    """Quick check that the XRPL client can reach the network."""
    try:
        client = get_client()
        resp = client.request(AccountInfo(account="rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"))
        return resp.is_successful()
    except Exception:
        return False


# ─── Currency helpers ─────────────────────────────────────────────────────────

def currency_hex(code: str) -> str:
    """
    XRPL requires currency codes > 3 chars to be 40-char hex.
    3-char codes are used as-is.
    """
    if len(code) <= 3:
        return code
    hex_code = code.encode("ascii").hex().upper()
    return hex_code.ljust(40, "0")


def issued_amount(token_id: str, amount: float | int | str, issuer: str) -> IssuedCurrencyAmount:
    """Create an IssuedCurrencyAmount with proper hex currency code."""
    return IssuedCurrencyAmount(
        currency=currency_hex(token_id),
        issuer=issuer,
        value=str(amount),
    )


# ─── Wallet helpers ──────────────────────────────────────────────────────────

def wallet_from_seed(seed: str) -> Wallet:
    """Reconstruct a wallet from its seed."""
    return Wallet.from_seed(seed)


# ─── Balance queries ─────────────────────────────────────────────────────────

def get_xrp_balance(address: str) -> str:
    """Get XRP balance for an address."""
    client = get_client()
    try:
        resp = client.request(AccountInfo(account=address))
        if resp.is_successful():
            drops = int(resp.result["account_data"]["Balance"])
            return str(drops / 1_000_000)
    except Exception as e:
        logger.warning(f"Failed to get XRP balance for {address}: {e}")
    return "0"


def get_token_balances(address: str, issuer_addresses: dict[str, str]) -> dict[str, str]:
    """
    Get all issued-token balances for an address.
    issuer_addresses: {token_id: issuer_classic_address}
    """
    client = get_client()
    balances: dict[str, str] = {}

    # Init all to 0
    for token_id in TOKENS:
        balances[token_id] = "0"

    try:
        marker = None
        while True:
            kwargs: dict[str, Any] = {"account": address}
            if marker:
                kwargs["marker"] = marker
            resp = client.request(AccountLines(**kwargs))
            if not resp.is_successful():
                break
            for line in resp.result.get("lines", []):
                # Match by currency hex + issuer
                for token_id, issuer_addr in issuer_addresses.items():
                    expected_hex = currency_hex(token_id)
                    if line["currency"] == expected_hex and line["account"] == issuer_addr:
                        balances[token_id] = line["balance"]
                        break
            marker = resp.result.get("marker")
            if not marker:
                break
    except Exception as e:
        logger.warning(f"Failed to get token balances for {address}: {e}")

    return balances


def get_all_balances(address: str, issuer_addresses: dict[str, str]) -> dict[str, str]:
    """Get XRP + all token balances."""
    result = get_token_balances(address, issuer_addresses)
    result["xrp"] = get_xrp_balance(address)
    return result


# ─── TrustSet ─────────────────────────────────────────────────────────────

def set_trustline(user_wallet: Wallet, token_id: str, issuer_address: str, limit: str = "1000000000") -> dict:
    """Establish a trustline from user to issuer for a given token."""
    client = get_client()
    tx = TrustSet(
        account=user_wallet.address,
        limit_amount=issued_amount(token_id, limit, issuer_address),
    )
    resp = submit_and_wait(tx, client, user_wallet)
    return {
        "tx_hash": resp.result.get("hash", ""),
        "success": resp.is_successful(),
    }


# ─── Mint (issuer → user Payment) ────────────────────────────────────────────

def mint_token(issuer_wallet: Wallet, user_address: str, token_id: str, amount: float) -> dict:
    """
    Mint tokens by sending a Payment from the issuer wallet to the user.
    The issuer is the currency creator, so this creates new supply.
    """
    client = get_client()
    tx = Payment(
        account=issuer_wallet.address,
        destination=user_address,
        amount=issued_amount(token_id, amount, issuer_wallet.address),
    )
    resp = submit_and_wait(tx, client, issuer_wallet)
    tx_hash = resp.result.get("hash", "")
    return {
        "tx_hash": tx_hash,
        "token": token_id,
        "amount": amount,
        "success": resp.is_successful(),
        "explorer": f"{XRPL_EXPLORER_BASE}{tx_hash}",
    }


# ─── Swap (cross-currency Payment with pathfinding) ──────────────────────────

def execute_swap(
    user_wallet: Wallet,
    from_token: str,
    to_token: str,
    amount: float,
    issuer_addresses: dict[str, str],
) -> dict:
    """
    Execute a swap via cross-currency Payment.
    XRPL's built-in pathfinding handles the AMM routing automatically.
    We send `amount` of from_token and deliver as much to_token as possible.
    """
    client = get_client()

    from_issuer = issuer_addresses[from_token]
    to_issuer = issuer_addresses[to_token]

    # We use a Payment with SendMax (what we spend) and Amount (what we want to receive).
    # Using partial payment flag lets the engine find the best path.
    tx = Payment(
        account=user_wallet.address,
        destination=user_wallet.address,  # swap to self
        amount=issued_amount(to_token, "999999999", to_issuer),  # deliver max possible
        send_max=issued_amount(from_token, amount, from_issuer),
        flags=131072,  # tfPartialPayment
    )

    resp = submit_and_wait(tx, client, user_wallet)
    tx_hash = resp.result.get("hash", "")

    # Parse delivered amount from metadata
    delivered = "0"
    meta = resp.result.get("meta", {})
    if isinstance(meta, dict):
        da = meta.get("delivered_amount", {})
        if isinstance(da, dict):
            delivered = da.get("value", "0")
        elif isinstance(da, str):
            delivered = str(int(da) / 1_000_000)  # XRP drops

    return {
        "tx_hash": tx_hash,
        "from_token": from_token,
        "to_token": to_token,
        "amount_in": amount,
        "output_amount": float(delivered),
        "success": resp.is_successful(),
        "explorer": f"{XRPL_EXPLORER_BASE}{tx_hash}",
    }


# ─── P2P Transfer ────────────────────────────────────────────────────────────

def send_p2p(
    sender_wallet: Wallet,
    to_address: str,
    token_id: str,
    amount: float,
    issuer_address: str,
) -> dict:
    """Send tokens from one user to another via Payment."""
    client = get_client()
    tx = Payment(
        account=sender_wallet.address,
        destination=to_address,
        amount=issued_amount(token_id, amount, issuer_address),
    )
    resp = submit_and_wait(tx, client, sender_wallet)
    tx_hash = resp.result.get("hash", "")
    return {
        "tx_hash": tx_hash,
        "success": resp.is_successful(),
        "explorer": f"{XRPL_EXPLORER_BASE}{tx_hash}",
    }


# ─── Quote (estimate swap output from AMM reserves) ──────────────────────────

def get_quote(
    from_token: str,
    to_token: str,
    amount: float,
    issuer_addresses: dict[str, str],
) -> dict:
    """
    Get a swap quote by querying AMM pool reserves.
    Route: from_token → XRP → to_token (two-hop via AMMs).
    Uses constant-product x*y=k to compute output.
    """
    client = get_client()

    from_issuer = issuer_addresses.get(from_token)
    to_issuer = issuer_addresses.get(to_token)

    if not from_issuer or not to_issuer:
        return {"error": f"Unknown token pair: {from_token}/{to_token}"}

    # Get AMM info for from_token/XRP pool
    from_pool = _get_amm_reserves(client, from_token, from_issuer)
    to_pool = _get_amm_reserves(client, to_token, to_issuer)

    if not from_pool or not to_pool:
        # Fallback: use config prices for estimate
        from_price = TOKENS.get(from_token, {}).get("price_usd", 0.5)
        to_price = TOKENS.get(to_token, {}).get("price_usd", 0.5)
        ratio = from_price / to_price if to_price > 0 else 1
        estimated = amount * ratio * 0.994  # 0.6% fee for two hops
        return {
            "input": from_token,
            "output": to_token,
            "input_amount": amount,
            "output_amount": round(estimated, 2),
            "price_impact": 0.15,
            "path": [from_token, "XRP", to_token],
            "rate": round(ratio * 0.994, 4),
            "expires_in": 30,
            "source": "estimate",
        }

    # Hop 1: from_token → XRP
    xrp_out = _constant_product_out(amount, from_pool["token_reserve"], from_pool["xrp_reserve"], 0.003)

    # Hop 2: XRP → to_token
    token_out = _constant_product_out(xrp_out, to_pool["xrp_reserve"], to_pool["token_reserve"], 0.003)

    # Price impact
    ideal_rate = (from_pool["xrp_reserve"] / from_pool["token_reserve"]) * (to_pool["token_reserve"] / to_pool["xrp_reserve"])
    expected = amount * ideal_rate
    price_impact = abs(expected - token_out) / expected * 100 if expected > 0 else 0

    return {
        "input": from_token,
        "output": to_token,
        "input_amount": amount,
        "output_amount": round(token_out, 2),
        "price_impact": round(price_impact, 2),
        "path": [from_token, "XRP", to_token],
        "rate": round(token_out / amount, 4) if amount > 0 else 0,
        "expires_in": 30,
        "source": "amm",
    }


def _get_amm_reserves(client: JsonRpcClient, token_id: str, issuer: str) -> dict | None:
    """Query AMM reserves for a token/XRP pool."""
    try:
        resp = client.request(AMMInfo(
            asset={"currency": currency_hex(token_id), "issuer": issuer},
            asset2={"currency": "XRP"},
        ))
        if not resp.is_successful():
            return None
        amm = resp.result.get("amm", {})
        amount1 = amm.get("amount", {})
        amount2 = amm.get("amount2", {})

        # Figure out which is XRP and which is the token
        xrp_reserve = 0.0
        token_reserve = 0.0

        if isinstance(amount1, str):
            # amount1 is XRP (in drops)
            xrp_reserve = int(amount1) / 1_000_000
            token_reserve = float(amount2.get("value", 0)) if isinstance(amount2, dict) else 0
        elif isinstance(amount2, str):
            xrp_reserve = int(amount2) / 1_000_000
            token_reserve = float(amount1.get("value", 0)) if isinstance(amount1, dict) else 0
        else:
            return None

        if xrp_reserve <= 0 or token_reserve <= 0:
            return None

        return {"xrp_reserve": xrp_reserve, "token_reserve": token_reserve}
    except Exception as e:
        logger.warning(f"Failed to get AMM info for {token_id}: {e}")
        return None


def _constant_product_out(amount_in: float, reserve_in: float, reserve_out: float, fee: float = 0.003) -> float:
    """Constant product AMM: x * y = k. Returns output amount."""
    if amount_in <= 0 or reserve_in <= 0 or reserve_out <= 0:
        return 0
    amount_with_fee = amount_in * (1 - fee)
    numerator = amount_with_fee * reserve_out
    denominator = reserve_in + amount_with_fee
    return numerator / denominator
