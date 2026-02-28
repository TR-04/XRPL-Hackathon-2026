# 🔄 LoyaltySwap

**Swap loyalty points anywhere on XRPL**

> Unlocking ~$10B AUD in siloed loyalty value. Trade Macca's for Qantas, Woolworths for Boost Juice — instantly, trustlessly, on-chain.

![LoyaltySwap Banner](https://img.shields.io/badge/XRPL-Sydney%20Hackathon%202026-FF007A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgNy4zNzVWMTYuNjI1TDEyIDIyTDIyIDE2LjYyNVY3LjM3NUwxMiAyWiIvPjwvc3ZnPg==)
![Build](https://img.shields.io/badge/build-passing-27AE60?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![XRPL](https://img.shields.io/badge/network-XRPL%20Testnet-8B5CF6?style=flat-square)

---

## 🎯 The Problem

Australians hold **$10B+ AUD** in loyalty points trapped in silos. You can't swap Macca's points for Qantas miles. Points expire. Value is lost.

**LoyaltySwap** tokenises loyalty points as **XRPL Multi-Purpose Tokens (MPTs)**, enabling market-driven **AMM swaps** via rippling — no brand system changes required.

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd loyaltyswap

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🚀 Features

### 🔁 AMM Swap Widget (Hero)
Uniswap-style two-panel swap interface. Select any loyalty token pair, see live AMM quotes with optimal routing (`mMacca → XRP → mQantas`), price impact, and execute atomic swaps.

### 💰 7 Tokenised Australian Brands

| Token | Brand | Price (AUD) | Description |
|-------|-------|-------------|-------------|
| 🍔 `mMacca` | McDonald's AU | $0.80 | MyMacca's Rewards |
| ✈️ `mQantas` | Qantas Airways | $1.00 | Frequent Flyer Points |
| 🛒 `mWoolies` | Woolworths | $0.65 | Everyday Rewards |
| 🌮 `mGYG` | Guzman y Gomez | $0.45 | GYG Loyalty |
| 🎧 `mJBHiFi` | JB Hi-Fi | $0.55 | Perks Member Points |
| 🏷️ `mKmart` | Kmart Australia | $0.30 | Flybuys Rewards |
| 🥤 `mBoost` | Boost Juice | $0.35 | Vibe Club Stamps |

### 💧 Liquidity Pools
Provide liquidity to earn **0.3% AMM fees**. View TVL, APY, and pool share in real-time.

### 📲 P2P Transfers
Send tokenised points to any XRPL address. QR code generation for instant sharing.

### 🏧 On-Ramp (Deposit)
Mock custodial ramp with 3-step flow: select brand → scan QR → mint MPT tokens 1:1.

### 📊 Platform Stats
Live dashboard showing volume ($127k+), platform fees ($382), total swaps (1,247), and XRPL execution speed (<3s).

### 🎉 Success Animations
Confetti celebration on every successful transaction with clickable explorer links.

---

## 🎮 Demo Flow (For Hackathon Judges)

Follow this exact flow to see the full LoyaltySwap experience:

### Step 1: Connect Wallet
1. Click **"Connect Wallet"** (top-right, pink button)
2. Wait ~1.5s for Xaman wallet simulation
3. ✅ You'll see your truncated XRPL address (`rLoyaL...ThOn`)

### Step 2: Execute a Swap
1. On the **Swap** tab (default), enter `1000` in the "You pay" field
2. Note the live quote: **~792 mQantas** from 1,000 mMacca
3. See the routing: **mMacca → XRP → mQantas**
4. Click **"Swap"** — watch the ~2s execution
5. 🎉 **Confetti!** See your transaction hash and explorer link
6. Click **"Done"** — your balances are updated

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
loyaltyswap/
├── index.html              # Entry point with Inter font + SEO
├── vite.config.js           # Vite + React config
├── package.json
└── src/
    ├── main.jsx             # React root with WalletProvider
    ├── App.jsx              # Main layout: tabs, hero, footer
    ├── index.css            # Full design system (600+ lines)
    ├── context/
    │   └── WalletContext.jsx # Mock wallet state (connect, balances)
    ├── data/
    │   ├── tokens.js        # 7 brand token definitions
    │   └── pools.js         # AMM pools + constant product pricing
    └── components/
        ├── Navbar.jsx       # Sticky nav + tab bar + wallet button
        ├── SwapWidget.jsx   # Uniswap-style swap interface
        ├── TokenSelector.jsx# Searchable token modal
        ├── BrandGrid.jsx    # 7-card token overview grid  
        ├── LiquidityPanel.jsx # LP add/remove interface
        ├── P2PTransfer.jsx  # Send tokens + QR code
        ├── OnRamp.jsx       # Mock deposit (scan → mint MPT)
        ├── SuccessOverlay.jsx # Confetti + tx hash display
        └── RevenueWidget.jsx # Platform stats dashboard
```

### How Swaps Work (Mock AMM)

```
User: Swap 1000 mMacca → mQantas

1. Route: mMacca → XRP → mQantas (two hops via XRP bridge)
2. Hop 1: mMacca → XRP (constant product: x * y = k)
3. Hop 2: XRP → mQantas (constant product: x * y = k)  
4. Fee: 0.3% per hop (0.6% total)
5. Result: ~792 mQantas received
6. Execution: <3s on XRPL (simulated ~1.8s)
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
| **Styling** | Vanilla CSS with design tokens |
| **Icons** | Lucide React |
| **QR Codes** | qrcode.react |
| **Animations** | react-confetti + CSS keyframes |
| **AMM Engine** | Custom constant product (x*y=k) |
| **Network** | XRPL Testnet (mock for demo) |

---

## 📈 Business Model

| Revenue Stream | Rate | Demo Status |
|---------------|------|-------------|
| AMM Swap Fees | 0.3% per hop | ✅ Displayed in Platform Stats |
| Custodial Ramp | 1% mint/burn | ✅ Mock on-ramp flow |
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

## 📝 License

MIT — Built with ❤️ for the **XRPL Sydney Hackathon 2026**

---

*"Meet Sarah, a Sydney professional drowning in Macca's points but short on Qantas for her Bali trip. She opens LoyaltySwap, swaps 1,000 mMacca for 792 mQantas via rippled AMM path — executed in 1.8 seconds — and books her flight. Finally unlocking $10B AU loyalty value."*
