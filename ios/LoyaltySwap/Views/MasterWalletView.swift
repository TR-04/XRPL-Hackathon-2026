import SwiftUI

struct MasterWalletView: View {
    @State private var data: MasterWalletData?
    @State private var loading = true
    @State private var refreshing = false
    
    var body: some View {
        ScrollView {
            if loading {
                VStack(spacing: 12) {
                    ProgressView()
                        .scaleEffect(1.2)
                        .tint(Color(hex: "FF007A"))
                    Text("Loading master wallet...")
                        .font(.system(size: 14))
                        .foregroundColor(DesignTokens.secondaryText)
                }
                .frame(maxWidth: .infinity)
                .padding(48)
                .onAppear { loadData() }
            } else if let d = data {
                VStack(spacing: 16) {
                    // Header card
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 12) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(Color(hex: "FF007A").opacity(0.2))
                                            .frame(width: 48, height: 48)
                                        Image(systemName: "shield.fill")
                                            .font(.system(size: 24))
                                            .foregroundColor(Color(hex: "FF007A"))
                                    }
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Master Wallet")
                                            .font(.system(size: 18, weight: .semibold))
                                            .foregroundColor(DesignTokens.primaryText)
                                        Text("Protocol fee collector — \(d.feeRate) on every transaction")
                                            .font(.system(size: 12))
                                            .foregroundColor(DesignTokens.secondaryText)
                                    }
                                }
                            }
                            Spacer()
                            Button(action: { fetchRevenue() }) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 16))
                                    .foregroundColor(DesignTokens.secondaryText)
                                    .rotationEffect(.degrees(refreshing ? 360 : 0))
                                    .animation(refreshing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: refreshing)
                            }
                            .disabled(refreshing)
                        }
                        
                        HStack {
                            Text(d.truncAddr)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(DesignTokens.primaryText)
                            Spacer()
                            Link(destination: URL(string: d.explorer) ?? URL(string: "https://testnet.xrpl.org")!) {
                                HStack(spacing: 4) {
                                    Text("View on Explorer")
                                        .font(.system(size: 12))
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 10))
                                }
                                .foregroundColor(Color(hex: "FF007A"))
                            }
                        }
                        
                        HStack(spacing: 24) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Total Revenue (USD)")
                                    .font(.system(size: 12))
                                    .foregroundColor(DesignTokens.secondaryText)
                                Text("$\(String(format: "%.2f", d.totalUsdRevenue))")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(Color(hex: "27AE60"))
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Transactions")
                                    .font(.system(size: 12))
                                    .foregroundColor(DesignTokens.secondaryText)
                                Text("\(d.totalTx)")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(DesignTokens.primaryText)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("XRP Balance")
                                    .font(.system(size: 12))
                                    .foregroundColor(DesignTokens.secondaryText)
                                Text("\(d.xrpBalance) XRP")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(DesignTokens.primaryText)
                            }
                        }
                    }
                    .padding(16)
                    .background(DesignTokens.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    
                    // Collected Fees by Token
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Collected Fees by Token")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(DesignTokens.primaryText)
                        
                        ForEach(Token.all) { t in
                            let bal = d.balances[t.id] ?? 0
                            let usd = bal * t.price
                            HStack {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(t.colorLight)
                                        .frame(width: 36, height: 36)
                                    TokenLogoView(token: t, size: 18)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(t.symbol)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(DesignTokens.primaryText)
                                    Text(t.name)
                                        .font(.system(size: 12))
                                        .foregroundColor(DesignTokens.secondaryText)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("\(Int(bal))")
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(DesignTokens.primaryText)
                                    Text("$\(String(format: "%.2f", usd))")
                                        .font(.system(size: 12))
                                        .foregroundColor(DesignTokens.secondaryText)
                                }
                            }
                            .padding(12)
                            .background(Color(hex: "F5F5F5"))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(16)
                    .background(DesignTokens.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    
                    // Full address
                    VStack(spacing: 8) {
                        Text("Full Master Wallet Address")
                            .font(.system(size: 12))
                            .foregroundColor(DesignTokens.secondaryText)
                        Text(d.address)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(DesignTokens.primaryText)
                            .multilineTextAlignment(.center)
                            .lineLimit(3)
                        Text("Click to copy")
                            .font(.system(size: 11))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(DesignTokens.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .padding(DesignTokens.screenPadding)
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 32))
                        .foregroundColor(DesignTokens.secondaryText)
                    Text("Master wallet not available")
                        .font(.system(size: 14))
                        .foregroundColor(DesignTokens.secondaryText)
                }
                .frame(maxWidth: .infinity)
                .padding(48)
            }
        }
        .background(DesignTokens.pageBackground)
    }
    
    private func loadData() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            data = MasterWalletData(
                address: "rMasterWalletDemo0000000000000000000",
                truncAddr: "rMasterW...000000",
                explorer: "https://testnet.xrpl.org",
                feeRate: "0.3%",
                totalTx: 42,
                xrpBalance: "125.50",
                totalUsdRevenue: 1250.75,
                balances: Dictionary(uniqueKeysWithValues: Token.all.map { ($0.id, Double.random(in: 10...500)) })
            )
            loading = false
        }
    }
    
    private func fetchRevenue() {
        refreshing = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            refreshing = false
        }
    }
}

struct MasterWalletData {
    let address: String
    let truncAddr: String
    let explorer: String
    let feeRate: String
    let totalTx: Int
    let xrpBalance: String
    let totalUsdRevenue: Double
    let balances: [String: Double]
}
