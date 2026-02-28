import os
import sys
import json
import logging
from xrpl.models import AccountSet, AccountSetAsfFlag
from xrpl.transaction import submit_and_wait

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.config import BRANDS, POOL_SEED_TOKEN_AMOUNT, POOL_SEED_XRP_AMOUNT
from app.xrpl_client import xrpl_manager

logging.basicConfig(level=logging.INFO)

def fix_pools():
    info_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wallet_info.json")
    with open(info_path) as f:
        info = json.load(f)

    for name, data in info["issuers"].items():
        wallet = xrpl_manager.wallet_from_seed(data["seed"])
        xrpl_manager.issuer_wallets[name] = wallet
        
    hot_wallet = xrpl_manager.wallet_from_seed(info["hot_wallet"]["seed"])
    for name, brand in BRANDS.items():
        issuer = xrpl_manager.issuer_wallets[name]
        try:
            xrpl_manager.create_amm_pool(
                creator_wallet=hot_wallet,
                currency=brand["currency_code"],
                issuer=issuer.address,
                token_amount=str(POOL_SEED_TOKEN_AMOUNT),
                xrp_amount=POOL_SEED_XRP_AMOUNT
            )
            print(f"  ✅ Created pool for {name}")
        except Exception as e:
            print(f"  ❌ Pool failed for {name}: {e}")

if __name__ == "__main__":
    fix_pools()
