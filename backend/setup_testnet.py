#!/usr/bin/env python3
"""
XRPL Testnet Setup Script for LoyaltySwap.

Run this ONCE before starting the backend:
    cd backend && python setup_testnet.py

What it does:
1. Creates 7 issuer wallets (one per loyalty token) via testnet faucet
2. Creates a demo user wallet via testnet faucet
3. Sets DefaultRipple on all issuers
4. Establishes TrustSets from demo user → each issuer
5. Mints initial tokens from each issuer → demo user
6. Creates 7 AMM pools (each token paired with XRP)
7. Saves all seeds + addresses to .env

This takes ~5-8 minutes due to faucet rate limits and retries.
"""
import os
import time
import traceback

from xrpl.clients import JsonRpcClient
from xrpl.models import (
    AccountInfo,
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

# Pool sizes kept small to fit within testnet faucet balance (~1000 XRP).
# 7 pools × 10 XRP = 70 XRP, leaving plenty for reserves.
TOKENS = {
    "mMacca":  {"initial_user_balance": 5000, "pool_token": 500, "pool_xrp": 10},
    "mQantas": {"initial_user_balance": 2000, "pool_token": 500, "pool_xrp": 10},
    "mWoolies":{"initial_user_balance": 4000, "pool_token": 500, "pool_xrp": 10},
    "mGYG":    {"initial_user_balance": 1000, "pool_token": 500, "pool_xrp": 10},
    "mJBHiFi": {"initial_user_balance": 1500, "pool_token": 500, "pool_xrp": 10},
    "mKmart":  {"initial_user_balance": 6000, "pool_token": 500, "pool_xrp": 10},
    "mBoost":  {"initial_user_balance": 2500, "pool_token": 500, "pool_xrp": 10},
}

MAX_RETRIES = 5
RETRY_DELAY = 4  # seconds


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


def retry_operation(func, label: str, retries=MAX_RETRIES, delay=RETRY_DELAY):
    """Retry a function up to `retries` times with exponential backoff."""
    for attempt in range(retries):
        try:
            result = func()
            return result
        except Exception as e:
            err_str = str(e)
            if attempt < retries - 1:
                wait = delay * (attempt + 1)
                print(f"\n    ⏳ {label} failed ({err_str}), retry in {wait}s (attempt {attempt + 2}/{retries})…", end="")
                time.sleep(wait)
            else:
                print(f"\n    ✗ {label} FAILED after {retries} attempts: {err_str}")
                return None
    return None


def fund_wallet(client: JsonRpcClient, label: str) -> Wallet:
    """Generate a funded testnet wallet with retries."""
    def _fund():
        return generate_faucet_wallet(client, debug=False)

    w = retry_operation(_fund, f"Fund {label}")
    if w is None:
        raise RuntimeError(f"Could not fund {label} after {MAX_RETRIES} attempts")
    print(f"  ✓ {label}: {w.address}")
    return w


def get_xrp_balance(client: JsonRpcClient, address: str) -> float:
    """Check XRP balance of an account."""
    try:
        resp = client.request(AccountInfo(account=address))
        if resp.is_successful():
            return int(resp.result["account_data"]["Balance"]) / 1_000_000
    except Exception:
        pass
    return 0.0


def main():
    client = JsonRpcClient(XRPL_URL)
    print("=" * 60)
    print("LoyaltySwap — XRPL Testnet Setup")
    print("=" * 60)

    # ── Step 1: Create issuer wallets ────────────────────────────────────
    print("\n[1/6] Creating issuer wallets…")
    issuer_wallets: dict[str, Wallet] = {}
    for token_id in TOKENS:
        issuer_wallets[token_id] = fund_wallet(client, f"{token_id} issuer")
        time.sleep(3)  # Be nice to the faucet

    # ── Step 2: Create demo user wallet ──────────────────────────────────
    print("\n[2/6] Creating demo user wallet…")
    demo_wallet = fund_wallet(client, "Demo User")

    # Check balance
    demo_balance = get_xrp_balance(client, demo_wallet.address)
    print(f"  Demo wallet XRP balance: {demo_balance}")

    # ── Step 3: Set DefaultRipple on issuers (MUST be done BEFORE minting) ──
    print("\n[3/6] Setting DefaultRipple on issuers…")
    for token_id, issuer_w in issuer_wallets.items():
        print(f"  AccountSet DefaultRipple: {token_id}…", end="")

        def _set_ripple(iw=issuer_w):
            tx = AccountSet(account=iw.address, set_flag=8)
            resp = submit_and_wait(tx, client, iw)
            if not resp.is_successful():
                raise Exception(f"Failed: {resp.result.get('engine_result', 'unknown')}")
            return resp

        result = retry_operation(_set_ripple, f"DefaultRipple {token_id}")
        print(" ✓" if result else " ✗ (will retry later)")
        time.sleep(2)

    # ── Step 4: Set trustlines (demo → each issuer) ──────────────────────
    print("\n[4/6] Setting trustlines…")
    for token_id, issuer_w in issuer_wallets.items():
        print(f"  TrustSet: Demo → {token_id}…", end="")

        def _trustline(tid=token_id, iw=issuer_w):
            tx = TrustSet(
                account=demo_wallet.address,
                limit_amount=issued_amount(tid, "1000000000", iw.address),
            )
            resp = submit_and_wait(tx, client, demo_wallet)
            if not resp.is_successful():
                raise Exception(f"Failed: {resp.result.get('engine_result', 'unknown')}")
            return resp

        result = retry_operation(_trustline, f"TrustSet {token_id}")
        print(" ✓" if result else " ✗ CRITICAL")
        time.sleep(2)

    # ── Step 5: Mint initial tokens to demo user ─────────────────────────
    print("\n[5/6] Minting initial tokens to demo user…")
    for token_id, info in TOKENS.items():
        issuer_w = issuer_wallets[token_id]
        total_mint = info["initial_user_balance"] + info["pool_token"]
        print(f"  Mint {total_mint} {token_id}…", end="")

        def _mint(iw=issuer_w, tid=token_id, amt=total_mint):
            tx = Payment(
                account=iw.address,
                destination=demo_wallet.address,
                amount=issued_amount(tid, amt, iw.address),
            )
            resp = submit_and_wait(tx, client, iw)
            if not resp.is_successful():
                code = resp.result.get("engine_result", "unknown")
                raise Exception(f"Transaction failed: {code}")
            return resp

        result = retry_operation(_mint, f"Mint {token_id}")
        print(" ✓" if result else " ✗ CRITICAL")
        time.sleep(2)

    # ── Step 6: Create AMM pools ─────────────────────────────────────────
    print("\n[6/6] Creating AMM pools (token/XRP)…")
    demo_balance = get_xrp_balance(client, demo_wallet.address)
    print(f"  Demo wallet XRP balance before AMM: {demo_balance:.2f} XRP")

    pools_created = 0
    for token_id, info in TOKENS.items():
        issuer_w = issuer_wallets[token_id]
        pool_token_amount = info["pool_token"]
        pool_xrp_amount = info["pool_xrp"]

        print(f"  AMMCreate: {token_id}/XRP ({pool_token_amount} tokens / {pool_xrp_amount} XRP)…", end="")

        def _create_amm(tid=token_id, iw=issuer_w, pt=pool_token_amount, px=pool_xrp_amount):
            tx = AMMCreate(
                account=demo_wallet.address,
                amount=issued_amount(tid, pt, iw.address),
                amount2=xrp_to_drops(px),
                trading_fee=300,  # 0.3%
            )
            resp = submit_and_wait(tx, client, demo_wallet)
            if not resp.is_successful():
                code = resp.result.get("engine_result", "unknown")
                raise Exception(f"Transaction failed: {code}")
            return resp

        result = retry_operation(_create_amm, f"AMMCreate {token_id}")
        if result:
            print(" ✓")
            pools_created += 1
        else:
            print(" ✗")
        time.sleep(2)

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
    final_balance = get_xrp_balance(client, demo_wallet.address)
    print(f"\n" + "=" * 60)
    print(f"SETUP COMPLETE!")
    print(f"Demo wallet: {demo_wallet.address}")
    print(f"Demo wallet XRP remaining: {final_balance:.2f}")
    print(f"Issuer wallets: {len(issuer_wallets)}")
    print(f"AMM pools created: {pools_created}/7")
    print("=" * 60)

    if pools_created < 7:
        print("\n⚠️  Some AMM pools failed. You may want to re-run the script.")
        print("    The script will create fresh wallets each time.")

    print("\nYou can now start the backend:")
    print("  cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload")


if __name__ == "__main__":
    main()
