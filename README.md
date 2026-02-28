# LoyaltySwap 🔄

> Swap loyalty points across 7 Australian brands instantly on the XRP Ledger.

**Frontend:** `http://localhost:3000`  
**Backend:** `http://localhost:8000`  
**Network:** XRPL Testnet

## Quick Start

### Option 1: Docker Compose
```bash
docker-compose up
```

### Option 2: Manual

#### Backend
```bash
cd backend
pip install -r requirements.txt

# First-time setup: create wallets, trustlines, AMM pools (~2 min)
# Test comment
python -m app.setup_testnet

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Demo Flow (30 seconds)
1. Open `http://localhost:3000`
2. Click **Connect Xaman** → wallet created with testnet XRP
3. Click **Scan & Mint 1,000 mMacca** → real XRPL tx with explorer link
4. Swap **500 mMacca → mQantas** → live pathfinding + AMM execution
5. Switch to Transfer tab → Send **100 mQantas** to a friend address
6. All transactions link to `testnet.xrpl.org` explorer

## 7 Brands
| Token | Brand | Price |
|-------|-------|-------|
| 🍔 mMacca | McDonald's | $0.80 |
| ✈️ mQantas | Qantas | $1.00 |
| 🛩️ mJetstar | Jetstar | $0.95 |
| 🌮 mGYG | Guzman y Gomez | $0.45 |
| 🍎 mApple | Apple | $2.50 |
| 💻 mMS | Microsoft | $0.10 |
| 🛒 mWoolies | Woolworths | $0.02 |

## Architecture
```
localhost:3000 (React TS / Vite)  ↔  localhost:8000 (FastAPI)  ↔  XRPL Testnet
```

## API Endpoints
- `GET /health` — Backend + XRPL connection status
- `POST /api/v1/auth/connect` — Connect / create wallet
- `POST /api/v1/tokens/mint/{token}` — Mint loyalty tokens
- `GET /api/v1/swaps/quote` — Real-time swap quotes
- `POST /api/v1/swaps/execute` — Execute swap
- `POST /api/v1/transfers/send` — P2P transfer
- `GET /api/v1/wallet/balances/{address}` — Token balances
