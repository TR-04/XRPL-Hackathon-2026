#!/usr/bin/env python3
"""
XRPL Testnet Setup Script for LoyaltySwap.

Run this ONCE before starting the backend:
    cd backend && python setup_testnet.py

What it does:
1. Creates 7 issuer wallets (one per loyalty token) via testnet faucet
2. Creates a demo user wallet via testnet faucet
3. Establishes TrustSets from demo user → each issuer
4. Mints initial tokens from each issuer → demo user
5. Creates 7 AMM pools (each token paired with XRP)
6. Saves all seeds + addresses to .env

This takes ~3-5 minutes due to faucet rate limits and ledger wait times.
"""
import os
import sys
import time

from xrpl.clients import JsonRpcClient
from xrpl.models import (
    AccountSet,
    AMMCreate,
    IssuedCurrencyAmount,
    Payment,
    TrustSet,
)
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops
from xrpl.wallet import generate_faucet_wallet, Wallet

# ─── Config ──────────────────────────────────────────────────────────────────

XRPL_URL = "https://s.altnet.rippletest.net:51234/"

TOKENS = {
    "mMacca":  {"initial_user_balance": 5000, "pool_token": 50000, "pool_xrp": 25000},
    "mQantas": {"initial_user_balance": 2000, "pool_token": 50000, "pool_xrp": 25000},
    "mWoolies":{"initial_user_balance": 4000, "pool_token": 50000, "pool_xrp": 25000},
    "mGYG":    {"initial_user_balance": 1000, "pool_token": 50000, "pool_xrp": 25000},
    "mJBHiFi": {"initial_user_balance": 1500, "pool_token": 50000, "pool_xrp": 25000},
    "mKmart":  {"initial_user_balance": 6000, "pool_token": 50000, "pool_xrp": 25000},
    "mBoost":  {"initial_user_balance": 2500, "pool_token": 50000, "pool_xrp": 25000},
}


def currency_hex(code: str) -> str:
    """Currency codes > 3 chars must be 40-char hex on XRPL."""
    if len(code) <= 3:
        return code
    return code.encode("ascii").hex().upper().ljust(40, "0")


def issued_amount(token_id: str, amount, issuer_address: str) -> IssuedCurrencyAmount:
    return IssuedCurrencyAmount(
        currency=currency_hex(token_id),
        issuer=issuer_address,
        value=str(amount),
    )


def fund_wallet(client: JsonRpcClient, label: str) -> Wallet:
    """Generate a funded testnet wallet (retries on faucet rate limits)."""
    for attempt in range(5):
        try:
            print(f"  Funding {label} (attempt {attempt + 1})…")
            w = generate_faucet_wallet(client, debug=False)
            print(f"  ✓ {label}: {w.address}")
            return w
        except Exception as e:
            if attempt < 4:
                wait = 10 * (attempt + 1)
                print(f"  ⏳ Faucet rate-limited, waiting {wait}s…")
                time.sleep(wait)
            else:
                print(f"  ✗ Failed to fund {label}: {e}")
                raise
    raise RuntimeError("unreachable")


def main():
    client = JsonRpcClient(XRPL_URL)
    print("=" * 60)
    print("LoyaltySwap — XRPL Testnet Setup")
    print("=" * 60)

    # ── Step 1: Create issuer wallets ────────────────────────────────────
    print("\n[1/5] Creating issuer wallets…")
    issuer_wallets: dict[str, Wallet] = {}
    for token_id in TOKENS:
        issuer_wallets[token_id] = fund_wallet(client, f"{token_id} issuer")
        time.sleep(2)  # Be nice to the faucet

    # ── Step 2: Create demo user wallet ──────────────────────────────────
    print("\n[2/5] Creating demo user wallet…")
    demo_wallet = fund_wallet(client, "Demo User")

    # We need extra XRP for AMM creation — fund additional wallets and merge
    # Each AMM pool needs owner reserve. Let's fund extra XRP to issuers.
    # The faucet gives ~100 XRP per wallet on testnet.

    # ── Step 3: Set trustlines ───────────────────────────────────────────
    print("\n[3/5] Setting trustlines…")
    for token_id, issuer_w in issuer_wallets.items():
        print(f"  TrustSet: Demo → {token_id}…", end=" ")
        try:
            tx = TrustSet(
                account=demo_wallet.address,
                limit_amount=issued_amount(token_id, "1000000000", issuer_w.address),
            )
            resp = submit_and_wait(tx, client, demo_wallet)
            print("✓" if resp.is_successful() else f"✗ {resp.result}")
        except Exception as e:
            print(f"✗ {e}")

    # Each issuer also needs a trustline? No — issuers create supply by sending.
    # But for AMM, the issuer needs to set DefaultRipple flag.
    print("\n  Setting DefaultRipple on issuers…")
    for token_id, issuer_w in issuer_wallets.items():
        print(f"  AccountSet DefaultRipple: {token_id}…", end=" ")
        try:
            tx = AccountSet(
                account=issuer_w.address,
                set_flag=8,  # asfDefaultRipple
            )
            resp = submit_and_wait(tx, client, issuer_w)
            print("✓" if resp.is_successful() else f"✗ {resp.result}")
        except Exception as e:
            print(f"✗ {e}")

    # ── Step 4: Mint initial tokens to demo user ─────────────────────────
    print("\n[4/5] Minting initial tokens to demo user…")
    for token_id, info in TOKENS.items():
        issuer_w = issuer_wallets[token_id]
        # Mint enough for: user balance + AMM pool seeding
        total_mint = info["initial_user_balance"] + info["pool_token"]
        # Mint to demo wallet first (they'll deposit into AMM)
        print(f"  Mint {total_mint} {token_id}…", end=" ")
        try:
            tx = Payment(
                account=issuer_w.address,
                destination=demo_wallet.address,
                amount=issued_amount(token_id, total_mint, issuer_w.address),
            )
            resp = submit_and_wait(tx, client, issuer_w)
            print("✓" if resp.is_successful() else f"✗ {resp.result}")
        except Exception as e:
            print(f"✗ {e}")

    # ── Step 5: Create AMM pools ─────────────────────────────────────────
    print("\n[5/5] Creating AMM pools (token/XRP)…")
    for token_id, info in TOKENS.items():
        issuer_w = issuer_wallets[token_id]
        pool_token_amount = info["pool_token"]
        pool_xrp_amount = info["pool_xrp"]

        print(f"  AMMCreate: {token_id}/XRP ({pool_token_amount} / {pool_xrp_amount} XRP)…", end=" ")
        try:
            tx = AMMCreate(
                account=demo_wallet.address,
                amount=issued_amount(token_id, pool_token_amount, issuer_w.address),
                amount2=xrp_to_drops(pool_xrp_amount),
                trading_fee=300,  # 0.3% = 300 basis points (max for AMM is 1000)
            )
            resp = submit_and_wait(tx, client, demo_wallet)
            if resp.is_successful():
                print("✓")
            else:
                result_code = resp.result.get("engine_result", "unknown")
                print(f"✗ ({result_code})")
        except Exception as e:
            print(f"✗ {e}")

    # ── Save .env ────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("Saving .env file…")
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    lines = [
        "# AUTO-GENERATED by setup_testnet.py — DO NOT COMMIT\n",
        f"# Generated at: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n",
    ]
    for token_id, w in issuer_wallets.items():
        lines.append(f"ISSUER_SEED_{token_id.upper()}={w.seed}\n")
        lines.append(f"ISSUER_ADDRESS_{token_id.upper()}={w.address}\n")
    lines.append(f"\nDEMO_WALLET_SEED={demo_wallet.seed}\n")
    lines.append(f"DEMO_WALLET_ADDRESS={demo_wallet.address}\n")

    with open(env_path, "w") as f:
        f.writelines(lines)

    print(f"✓ Saved to {env_path}")
    print("\n" + "=" * 60)
    print("SETUP COMPLETE!")
    print(f"Demo wallet: {demo_wallet.address}")
    print(f"Issuer wallets: {len(issuer_wallets)}")
    print("=" * 60)
    print("\nYou can now start the backend:")
    print("  cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload")


if __name__ == "__main__":
    main()
