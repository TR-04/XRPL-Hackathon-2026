import SwiftUI

struct DepositView: View {
    @ObservedObject var appState: AppState
    let onSuccess: (SuccessData) -> Void
    
    @State private var token = Token.all[0]
    @State private var amount = ""
    @State private var selectorOpen = false
    @State private var minting = false
    @State private var showDepositInfo = false
    @State private var step = 0
    
    private var numAmount: Double { Double(amount) ?? 0 }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Deposit Points")
                        .font(.system(size: 22, weight: .semibold))
                    Spacer()
                    Button(action: { showDepositInfo = true }) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 20))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .buttonStyle(.plain)
                }
                .alert("Deposit process", isPresented: $showDepositInfo) {
                    Button("OK", role: .cancel) { }
                } message: {
                    Text("1. Select brand & amount — Choose your loyalty program and points to deposit.\n\n2. Scan brand QR code — Verify points with the loyalty provider.\n\n3. Mint MPT tokens — 1:1 custodial mint to your XRPL wallet.")
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        TextField("0", text: $amount)
                            .font(.system(size: 24, weight: .semibold))
                            .keyboardType(.decimalPad)
                            .disabled(minting)
                        Button(action: { if !minting { selectorOpen = true } }) {
                            HStack(spacing: 8) {
                                TokenLogoView(token: token, size: 22)
                                Text(token.symbol)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(DesignTokens.primaryText)
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 12))
                                    .foregroundColor(DesignTokens.secondaryText)
                            }
                            .padding(8)
                            .background(Color(hex: "F5F5F5"))
                            .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                        .disabled(minting)
                    }
                    HStack {
                        Text("$\(String(format: "%.2f", numAmount * token.price)) value")
                            .font(.system(size: 13))
                            .foregroundColor(DesignTokens.secondaryText)
                        Spacer()
                        Text("1:1 mint ratio")
                            .font(.system(size: 13))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                }
                .padding(DesignTokens.cardPadding)
                .background(DesignTokens.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.cardRadius))
                
                Button(action: {
                    if !appState.connected {
                        appState.connectWallet()
                    } else if numAmount > 0, !minting {
                        performMint()
                    }
                }) {
                    HStack {
                        if minting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.9)
                            Text(step == 1 ? "Scanning QR…" : "Minting tokens…")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                        } else {
                            Image(systemName: "qrcode")
                                .font(.system(size: 14))
                                .foregroundColor(.white)
                            Text(!appState.connected ? "Connect Wallet" : "Scan & Mint \(token.symbol)")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.vertical, 14)
                    .background((appState.connected && (numAmount <= 0 || minting)) ? Color.gray : DesignTokens.ctaButton)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(appState.connected && (numAmount <= 0 || minting))
                
                PoweredByXRPLView(fontSize: 12)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)
            }
            .padding(DesignTokens.screenPadding)
        }
        .background(Color.clear)
        .scrollDismissesKeyboard(.interactively)
        .sheet(isPresented: $selectorOpen) {
            TokenSelectorSheet(selected: $token, exclude: "", getBalance: appState.getBalance)
        }
    }
    
    private func performMint() {
        minting = true
        step = 1
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            step = 2
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            appState.updateBalance(token.id, numAmount)
            minting = false
            step = 0
            amount = ""
            onSuccess(.mint(token: token, amount: numAmount, txHash: Pools.generateTxHash()))
        }
    }
}
