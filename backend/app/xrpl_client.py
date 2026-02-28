"""
XRPL Client — manages connection to XRPL Testnet and all on-ledger operations.

Uses xrpl-py following official tutorials exactly:
  - JsonRpcClient for connection
  - Wallet.from_seed() for custodial wallets
  - TrustSet, Payment, AMMCreate for token ops
  - submit_and_wait for atomic finality
"""

import logging
from typing import Dict, Optional

from xrpl.clients import JsonRpcClient
from xrpl.models import (
    AccountLines,
    AccountInfo,
    IssuedCurrencyAmount,
    Payment,
    TrustSet,
    AMMCreate,
    AMMDeposit,
    AMMWithdraw,
    Memo,
    XRP,
    PathFind,
    PathFindSubcommand
)
from xrpl.transaction import submit_and_wait, autofill
from xrpl.wallet import Wallet, generate_faucet_wallet
from xrpl.utils import xrp_to_drops, drops_to_xrp

from app.config import XRPL_TESTNET_URL, BRANDS, XRPL_EXPLORER_BASE

logger = logging.getLogger("loyaltyswap.xrpl")


class XRPLManager:
    """Singleton manager for all XRPL operations."""

    def __init__(self):
        self.client = JsonRpcClient(XRPL_TESTNET_URL)
        # issuer wallets: brand_name -> Wallet
        self.issuer_wallets: Dict[str, Wallet] = {}
        # AMM pool existence flags
        self.pools_ready: Dict[str, bool] = {}
        self._setup_complete = False

    @property
    def is_connected(self) -> bool:
        try:
            from xrpl.models import ServerInfo
            resp = self.client.request(ServerInfo())
            return resp.is_successful()
        except Exception:
            return False

    @property
    def pool_count(self) -> int:
        return sum(1 for v in self.pools_ready.values() if v)

    # ── Wallet Management ───────────────────────────────────────────

    def create_funded_wallet(self) -> Wallet:
        """Create a new testnet wallet funded via faucet."""
        logger.info("Creating funded testnet wallet via faucet...")
        wallet = generate_faucet_wallet(self.client, debug=True)
        logger.info(f"  → {wallet.address}")
        return wallet

    def wallet_from_seed(self, seed: str) -> Wallet:
        """Recover wallet from seed."""
        return Wallet.from_seed(seed)

    # ── Trustlines ──────────────────────────────────────────────────

    def set_trustline(self, wallet: Wallet, currency: str, issuer: str, limit: str = "1000000000") -> str:
        """Establish a trustline from wallet to issuer for the given currency."""
        tx = TrustSet(
            account=wallet.address,
            limit_amount=IssuedCurrencyAmount(
                currency=currency,
                issuer=issuer,
                value=limit,
            ),
        )
        logger.info(f"Setting trustline: {wallet.address} trusts {currency} from {issuer}")
        result = submit_and_wait(tx, self.client, wallet)
        tx_hash = result.result.get("hash", "")
        logger.info(f"  → TrustSet tx: {tx_hash}")
        return tx_hash

    # ── Payments (Minting & Transfers) ──────────────────────────────

    def send_payment(
        self,
        sender_wallet: Wallet,
        destination: str,
        currency: str,
        issuer: str,
        amount: str,
        memo_text: Optional[str] = None,
    ) -> str:
        """Send an issued currency payment."""
        memos = []
        if memo_text:
            memos = [
                Memo(
                    memo_data=memo_text.encode("utf-8").hex(),
                    memo_type="746578742f706c61696e",  # "text/plain" hex
                )
            ]

        tx = Payment(
            account=sender_wallet.address,
            destination=destination,
            amount=IssuedCurrencyAmount(
                currency=currency,
                issuer=issuer,
                value=amount,
            ),
            memos=memos if memos else None,
        )
        logger.info(f"Payment: {sender_wallet.address} → {destination} | {amount} {currency}")
        result = submit_and_wait(tx, self.client, sender_wallet)
        tx_hash = result.result.get("hash", "")
        logger.info(f"  → Payment tx: {tx_hash}")
        return tx_hash

    def send_xrp(self, sender_wallet: Wallet, destination: str, amount_xrp: float) -> str:
        """Send XRP."""
        tx = Payment(
            account=sender_wallet.address,
            destination=destination,
            amount=xrp_to_drops(amount_xrp),
        )
        result = submit_and_wait(tx, self.client, sender_wallet)
        return result.result.get("hash", "")

    # ── Cross-currency Swap (Pathfinding Payment) ───────────────────

    def cross_currency_payment(
        self,
        sender_wallet: Wallet,
        from_currency: str,
        from_issuer: str,
        to_currency: str,
        to_issuer: str,
        send_amount: str,
    ) -> dict:
        """
        Execute a cross-currency payment via XRPL pathfinding.
        The XRPL DEX + AMM pools find the best path automatically.
        """
        # We want to "deliver" the output token, paying with the input token.
        # Use SendMax to specify how much we're willing to pay.
        tx = Payment(
            account=sender_wallet.address,
            destination=sender_wallet.address,  # swap to self
            amount=IssuedCurrencyAmount(
                currency=to_currency,
                issuer=to_issuer,
                value="999999999",  # will be constrained by send_max
            ),
            send_max=IssuedCurrencyAmount(
                currency=from_currency,
                issuer=from_issuer,
                value=send_amount,
            ),
            flags=131072,  # tfPartialPayment
        )
        logger.info(f"Cross-currency swap: {send_amount} {from_currency} → {to_currency}")
        result = submit_and_wait(tx, self.client, sender_wallet)
        tx_hash = result.result.get("hash", "")

        # Extract delivered amount from metadata
        delivered = result.result.get("meta", {}).get("delivered_amount", {})
        if isinstance(delivered, dict):
            output_amount = delivered.get("value", "0")
        else:
            output_amount = "0"

        logger.info(f"  → Swap tx: {tx_hash}, delivered: {output_amount}")
        return {"tx_hash": tx_hash, "output_amount": output_amount}

    # ── AMM Pool Operations ─────────────────────────────────────────

    def create_amm_pool(
        self,
        creator_wallet: Wallet,
        currency: str,
        issuer: str,
        token_amount: str,
        xrp_amount: float,
    ) -> str:
        """Create an AMM pool for token/XRP pair."""
        tx = AMMCreate(
            account=creator_wallet.address,
            amount=IssuedCurrencyAmount(
                currency=currency,
                issuer=issuer,
                value=token_amount,
            ),
            amount2=xrp_to_drops(xrp_amount),
            trading_fee=500,  # 0.5% fee (in basis points ÷ 10)
        )
        logger.info(f"Creating AMM pool: {token_amount} {currency} + {xrp_amount} XRP")
        result = submit_and_wait(tx, self.client, creator_wallet)
        tx_hash = result.result.get("hash", "")
        logger.info(f"  → AMMCreate tx: {tx_hash}")
        return tx_hash

    # ── Balance Queries ─────────────────────────────────────────────

    def get_balances(self, address: str) -> Dict[str, str]:
        """Get all token balances + XRP for an address."""
        balances: Dict[str, str] = {}

        # XRP balance
        try:
            resp = self.client.request(AccountInfo(account=address))
            if resp.is_successful():
                xrp_drops = resp.result.get("account_data", {}).get("Balance", "0")
                balances["xrp"] = str(drops_to_xrp(xrp_drops))
        except Exception as e:
            logger.warning(f"Could not get XRP balance for {address}: {e}")
            balances["xrp"] = "0"

        # Token balances via account_lines
        try:
            resp = self.client.request(AccountLines(account=address))
            if resp.is_successful():
                for line in resp.result.get("lines", []):
                    currency = line.get("currency", "")
                    balance = line.get("balance", "0")
                    # Map currency code back to brand name
                    for brand_name, brand_info in BRANDS.items():
                        if brand_info["currency_code"] == currency:
                            balances[brand_name] = balance
                            break
        except Exception as e:
            logger.warning(f"Could not get token balances for {address}: {e}")

        # Fill in zeros for any brands not found
        for brand_name in BRANDS:
            if brand_name not in balances:
                balances[brand_name] = "0"

        return balances

    def get_explorer_link(self, tx_hash: str) -> str:
        return f"{XRPL_EXPLORER_BASE}{tx_hash}"


# Global singleton
xrpl_manager = XRPLManager()
