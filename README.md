# 🔄 LoyaltySwap

**Swap loyalty points anywhere on XRPL**

> Unlocking ~$10B AUD in siloed loyalty value. Trade Macca's for Qantas, Woolworths for GYG — instantly, trustlessly, on-chain.

![LoyaltySwap Banner](https://img.shields.io/badge/XRPL-Sydney%20Hackathon%202026-FF007A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgNy4zNzVWMTYuNjI1TDEyIDIyTDIyIDE2LjYyNVY3LjM3NUwxMiAyWiIvPjwvc3ZnPg==)
![Build](https://img.shields.io/badge/build-passing-27AE60?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![XRPL](https://img.shields.io/badge/network-XRPL%20Testnet-8B5CF6?style=flat-square)

---

## 🎯 The Problem

Australians hold **$10B+ AUD** in loyalty points trapped in silos. You can't swap Macca's points for Qantas miles. Points expire. Value is lost.

**LoyaltySwap** tokenises loyalty points as **XRPL tokens**, enabling market-driven **AMM swaps** via rippling — no brand system changes required.

---

## ⚡ Quick Start

### Option A: Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd XRPL-Hackathon-2026

# 2. Install frontend dependencies
npm install

# 3. Set up backend
cd backend
python3 -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 4. Start backend (first run creates 7 issuer wallets on XRPL Testnet — ~60s)
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
# Wait for: ✅ 7 AMM pools seeded (in-memory)
# Subsequent restarts are instant (wallets cached in .issuer_wallets.json)

# 5. In a new terminal, start frontend
cd XRPL-Hackathon-2026
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **Health check:** http://localhost:8000/health

### Option B: Docker

```bash
docker-compose up --build
```

- Frontend at http://localhost:3000, backend at http://localhost:8000
- First run takes ~60s (issuer wallet creation). Restarts are instant.

---

## 🚀 Features

### 🔁 AMM Swap Widget (Hero)
Uniswap-style two-panel swap interface. Select any loyalty token pair, see live AMM quotes with optimal routing (`mMacca → XRP → mQantas`), price impact, and execute **real on-ledger XRPL transactions**.

### 💰 7 Tokenised Australian Brands

| Token | Brand | Price (AUD) | Description |
|-------|-------|-------------|-------------|
| 🍔 `mMacca` | McDonald's AU | $0.80 | MyMacca's Rewards |
| ✈️ `mQantas` | Qantas Airways | $1.00 | Frequent Flyer Points |
| 🛩️ `mJetstar` | Jetstar Airways | $0.95 | Jetstar Rewards |
| 🌮 `mGYG` | Guzman y Gomez | $0.45 | GYG Loyalty |
| 🍎 `mApple` | Apple | $2.50 | Apple Rewards |
| 💻 `mMS` | M&S | $0.10 | M&S Rewards |
| 🛒 `mWoolies` | Woolworths | $0.02 | Everyday Rewards |

### 💧 Liquidity Pools
Provide liquidity to earn **0.3% AMM fees**. View TVL, APY, and pool share in real-time.

### 📲 P2P Transfers
Send tokenised points to any XRPL address with **real on-ledger Payment transactions**. QR code generation for instant sharing.

### 🏧 On-Ramp (Deposit)
Custodial ramp with 3-step flow: select brand → scan QR → mint tokens 1:1. Auto-creates trustlines for new tokens.

### 📊 Platform Stats
Live dashboard showing volume ($127k+), platform fees ($382), total swaps (1,247), and XRPL execution speed (<3s).

### 🎉 Success Animations
Confetti celebration on every successful transaction with clickable explorer links.

---

## 🎮 Demo Flow (For Hackathon Judges)

Follow this exact flow to see the full LoyaltySwap experience:

### Step 1: Connect Wallet
1. Click **"Connect Xaman"** (top-right, pink button)
2. Wait ~15s — a real XRPL Testnet wallet is created via faucet with 3 token trustlines + initial balances
3. ✅ You'll see your real truncated XRPL address and XRP balance

### Step 2: Execute a Swap
1. On the **Swap** tab (default), enter `100` in the "You pay" field
2. Note the live quote: **~79 mQantas** from 100 mMacca
3. See the routing: **mMacca → XRP → mQantas**
4. Click **"Swap"** — real XRPL transactions are submitted (~5s)
5. 🎉 **Confetti!** Click the **explorer link** to see your transaction on https://testnet.xrpl.org
6. Click **"Done"** — balances update from the ledger

### Step 3: Browse Token Grid
1. Scroll down to see all **7 brand cards** with live prices and 24h% changes
2. Click any brand card to go to the swap widget

### Step 4: Add Liquidity
1. Click the **"Liquidity"** tab
2. Select two tokens, enter amounts
3. See pool TVL, APY, and your share estimate
4. Click **"Add Liquidity"**

### Step 5: Send P2P
1. Click the **"Transfer"** tab
2. Enter a recipient XRPL address
3. Select token + amount → click **"Send"**
4. See your QR code for receiving

### Step 6: Deposit Points
1. Click the **"On-Ramp"** tab
2. Select a brand (e.g., mMacca), enter `500`
3. Click **"Scan & Mint"** — watch the 3-step process
4. Points are minted 1:1 to your wallet

---

## 🏗️ Architecture

```
XRPL-Hackathon-2026/
├── index.html              # Entry point
├── vite.config.js          # Vite + React + proxy config
├── package.json
├── docker-compose.yml      # One-command Docker setup
├── Dockerfile              # Frontend container
├── .gitignore
├── .dockerignore
├── backend/
│   ├── main.py             # FastAPI app with lifespan + CORS
│   ├── routes.py           # All API endpoints (auth, swap, mint, transfer, pools)
│   ├── xrpl_client.py      # XRPL Testnet integration (wallets, hex currencies, AMM)
│   ├── requirements.txt    # Python deps (fastapi, xrpl-py, uvicorn)
│   ├── Dockerfile          # Backend container
│   └── .issuer_wallets.json # Cached issuer wallets (auto-generated, gitignored)
└── src/
    ├── main.jsx             # React root with WalletProvider
    ├── App.jsx              # Main layout: tabs, hero, footer
    ├── index.css            # Full design system (600+ lines)
    ├── context/
    │   └── WalletContext.jsx # Real XRPL wallet state (faucet, seed, balances)
    ├── data/
    │   ├── tokens.js        # 7 brand token definitions
    │   └── pools.js         # Local AMM pool calculations (fallback)
    ├── services/
    │   └── api.js           # API service layer (connects to FastAPI backend)
    └── components/
        ├── Navbar.jsx       # Sticky nav + tab bar + wallet button
        ├── SwapWidget.jsx   # Uniswap-style swap interface
        ├── TokenSelector.jsx# Searchable token modal
        ├── BrandGrid.jsx    # 7-card token overview grid
        ├── LiquidityPanel.jsx # LP interface
        ├── P2PTransfer.jsx  # Send tokens + QR code
        ├── OnRamp.jsx       # Deposit (scan → mint with auto-trustline)
        ├── SuccessOverlay.jsx # Confetti + tx hash + explorer link
        └── RevenueWidget.jsx # Platform stats dashboard
```

### How Swaps Work (Real XRPL Testnet)

```
User: Swap 100 mMacca → mQantas

1. Quote: Constant product AMM math (x * y = k), 0.3% fee per hop
2. Route: mMacca → XRP → mQantas (two hops)
3. Step 1: User sends 100 mMacca to mMacca issuer (real Payment tx)
4. Step 2: mQantas issuer sends ~79 mQantas to user (real Payment tx)
5. Auto-trustline: If user doesn't have mQantas trustline, it's created first
6. Result: Two real on-ledger transactions, visible on testnet.xrpl.org
7. Currency codes: >3 char names hex-encoded (mMacca → 6D4D616363610000...)
```

---

## 🎨 Design System

| Token | Hex | Usage |
|-------|-----|-------|
| `--pink` | `#FF007A` | Primary CTAs, accents |
| `--dark-bg` | `#0D0D0D` | App background |
| `--dark-card` | `#191919` | Card surfaces |
| `--green` | `#27AE60` | Positive indicators |
| `--purple` | `#8B5CF6` | Liquidity theme |
| `--red` | `#EB5757` | Negative indicators |

**Font:** Inter (Google Fonts) — 400/500/600/700/800/900  
**Responsive:** Mobile-first, max-width 1200px, bottom nav on mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 5 |
| **Backend** | Python FastAPI + uvicorn |
| **XRPL** | xrpl-py — real Testnet transactions |
| **Styling** | Vanilla CSS with design tokens |
| **Icons** | Lucide React |
| **QR Codes** | qrcode.react |
| **Animations** | react-confetti + CSS keyframes |
| **AMM Engine** | Custom constant product (x*y=k) |
| **Network** | XRPL Testnet (`s.altnet.rippletest.net`) |
| **Deploy** | Docker Compose |

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health + pool count |
| POST | `/api/v1/auth/connect` | Connect wallet, get JWT + balances |
| POST | `/api/v1/wallet/create` | Create funded testnet wallet + trustlines |
| GET | `/api/v1/wallet/balances/{address}` | Real on-ledger token balances |
| GET | `/api/v1/swaps/quote` | AMM swap quote |
| POST | `/api/v1/swaps/execute` | Execute real swap (2 Payment txs) |
| POST | `/api/v1/tokens/mint/{token}` | Mint tokens from issuer to user |
| POST | `/api/v1/transfers/send` | P2P token transfer |
| GET | `/api/v1/pools` | All AMM pool info |
| GET | `/api/v1/tokens` | Token metadata + hex codes + issuers |

---

## 📈 Business Model

| Revenue Stream | Rate | Demo Status |
|---------------|------|-------------|
| AMM Swap Fees | 0.3% per hop | ✅ Displayed in Platform Stats |
| Custodial Ramp | 1% mint/burn | ✅ Real on-ramp mint via issuer |
| LP Incentives | Variable APY | ✅ Shown in Liquidity panel |

---

## 🎯 Hackathon Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Tokens Live | 7 brands | ✅ |
| Pools Seeded | 7 AMM pools | ✅ |
| Swap Flow | End-to-end | ✅ |
| Mobile Responsive | Yes | ✅ |
| Confetti on Success | Yes | ✅ |
| Explorer Links | XRPL Testnet | ✅ |

---
