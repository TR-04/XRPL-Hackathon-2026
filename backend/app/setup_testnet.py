"""
XRPL Testnet Setup Script — run once before demo.

Creates:
  1. 7 issuer wallets (one per brand) via testnet faucet
  2. 1 hot wallet for AMM pool creation
  3. Trustlines from hot wallet to each issuer
  4. Issues tokens from issuers to hot wallet
  5. Creates 7 AMM pools (token/XRP)
"""

import asyncio
import logging
import json
import time
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import BRANDS, POOL_SEED_TOKEN_AMOUNT, POOL_SEED_XRP_AMOUNT
from app.xrpl_client import xrpl_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("loyaltyswap.setup")


def setup_testnet():
    """Full testnet setup — creates wallets, trustlines, and AMM pools."""

    logger.info("=" * 60)
    logger.info("LoyaltySwap XRPL Testnet Setup")
    logger.info("=" * 60)

    # Step 1: Create issuer wallets
    logger.info("\n📦 Step 1: Creating 7 issuer wallets...")
    for brand_name in BRANDS:
        logger.info(f"  Creating wallet for {brand_name}...")
        wallet = xrpl_manager.create_funded_wallet()
        xrpl_manager.issuer_wallets[brand_name] = wallet
        logger.info(f"  ✅ {brand_name}: {wallet.address}")
        time.sleep(1)  # Rate limit faucet

    # Step 2: Create hot wallet for AMM pool creation
    logger.info("\n🔥 Step 2: Creating hot wallet for AMM pools...")
    hot_wallet = xrpl_manager.create_funded_wallet()
    logger.info(f"  ✅ Hot wallet: {hot_wallet.address}")
    time.sleep(1)

    # We need extra XRP for creating multiple AMM pools
    # Get a few more funded wallets and transfer XRP to hot wallet
    logger.info("\n💰 Step 2b: Funding hot wallet with extra XRP...")
    for i in range(6):
        logger.info(f"  Funding round {i+1}/6...")
        funder = xrpl_manager.create_funded_wallet()
        try:
            xrpl_manager.send_xrp(funder, hot_wallet.address, 90)
            logger.info(f"  ✅ Transferred 90 XRP from {funder.address}")
        except Exception as e:
            logger.warning(f"  ⚠️ Funding failed: {e}")
        time.sleep(1)

    # Step 3: Set trustlines from hot wallet to each issuer
    logger.info("\n🔗 Step 3: Setting trustlines...")
    for brand_name, brand_info in BRANDS.items():
        issuer = xrpl_manager.issuer_wallets[brand_name]
        try:
            xrpl_manager.set_trustline(
                hot_wallet,
                brand_info["currency_code"],
                issuer.address,
            )
            logger.info(f"  ✅ Trustline: {brand_name} ({brand_info['currency_code']})")
        except Exception as e:
            logger.error(f"  ❌ Trustline failed for {brand_name}: {e}")
        time.sleep(0.5)

    # Step 4: Issue tokens from issuers to hot wallet
    logger.info(f"\n🪙 Step 4: Issuing {POOL_SEED_TOKEN_AMOUNT} tokens each to hot wallet...")
    for brand_name, brand_info in BRANDS.items():
        issuer = xrpl_manager.issuer_wallets[brand_name]
        try:
            xrpl_manager.send_payment(
                sender_wallet=issuer,
                destination=hot_wallet.address,
                currency=brand_info["currency_code"],
                issuer=issuer.address,
                amount=str(POOL_SEED_TOKEN_AMOUNT),
            )
            logger.info(f"  ✅ Issued {POOL_SEED_TOKEN_AMOUNT} {brand_name}")
        except Exception as e:
            logger.error(f"  ❌ Issuance failed for {brand_name}: {e}")
        time.sleep(0.5)

    # Step 5: Create AMM pools
    logger.info(f"\n🏊 Step 5: Creating 7 AMM pools ({POOL_SEED_TOKEN_AMOUNT} tokens + {POOL_SEED_XRP_AMOUNT} XRP each)...")
    for brand_name, brand_info in BRANDS.items():
        issuer = xrpl_manager.issuer_wallets[brand_name]
        try:
            tx_hash = xrpl_manager.create_amm_pool(
                creator_wallet=hot_wallet,
                currency=brand_info["currency_code"],
                issuer=issuer.address,
                token_amount=str(POOL_SEED_TOKEN_AMOUNT),
                xrp_amount=POOL_SEED_XRP_AMOUNT,
            )
            xrpl_manager.pools_ready[brand_name] = True
            logger.info(f"  ✅ Pool {brand_name}/XRP created: {tx_hash}")
        except Exception as e:
            logger.error(f"  ❌ Pool creation failed for {brand_name}: {e}")
            xrpl_manager.pools_ready[brand_name] = False
        time.sleep(1)

    # Save wallet info
    wallet_info = {
        "hot_wallet": {"address": hot_wallet.address, "seed": hot_wallet.seed},
        "issuers": {
            name: {"address": w.address, "seed": w.seed}
            for name, w in xrpl_manager.issuer_wallets.items()
        },
    }

    info_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "wallet_info.json")
    with open(info_path, "w") as f:
        json.dump(wallet_info, f, indent=2)
    logger.info(f"\n💾 Wallet info saved to {info_path}")

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("SETUP COMPLETE")
    logger.info(f"  Issuer wallets: {len(xrpl_manager.issuer_wallets)}")
    logger.info(f"  AMM pools:      {xrpl_manager.pool_count}")
    logger.info(f"  Hot wallet:     {hot_wallet.address}")
    logger.info("=" * 60)

    return wallet_info


def load_wallets_from_file():
    """Load previously saved wallets (for restart without re-setup)."""
    info_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "wallet_info.json")
    if not os.path.exists(info_path):
        return False

    with open(info_path, "r") as f:
        info = json.load(f)

    for brand_name, wallet_data in info.get("issuers", {}).items():
        xrpl_manager.issuer_wallets[brand_name] = xrpl_manager.wallet_from_seed(wallet_data["seed"])
        xrpl_manager.pools_ready[brand_name] = True

    logger.info(f"Loaded {len(xrpl_manager.issuer_wallets)} issuer wallets from file")
    return True


if __name__ == "__main__":
    setup_testnet()
