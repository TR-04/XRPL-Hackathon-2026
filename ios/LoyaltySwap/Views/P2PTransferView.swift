import SwiftUI

struct P2PTransferView: View {
    @ObservedObject var appState: AppState
    let onSuccess: (SuccessData) -> Void
    
    @State private var token = Token.all[1]
    @State private var amount = ""
    @State private var recipient = ""
    @State private var memo = ""
    @State private var selectorOpen = false
    @State private var showSendInfo = false
    @State private var loading = false
    
    private var numAmount: Double { Double(amount) ?? 0 }
    private var balance: Double { appState.getBalance(token.id) }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Send Tokens")
                        .font(.system(size: 22, weight: .semibold))
                    Spacer()
                    Button(action: { showSendInfo = true }) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 20))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .buttonStyle(.plain)
                }
                .alert("How P2P works", isPresented: $showSendInfo) {
                    Button("OK", role: .cancel) { }
                } message: {
                    Text("Send your loyalty points directly to any XRPL address. Enter the recipient's address, amount, and send — points transfer instantly on the XRPL.")
                }
                
                TextField("Recipient XRPL address (r...)", text: $recipient)
                    .font(.system(size: 14))
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.vertical, 10)
                    .background(DesignTokens.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: DesignTokens.cardRadius))
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        TextField("0", text: $amount)
                            .font(.system(size: 24, weight: .semibold))
                            .keyboardType(.decimalPad)
                        Button(action: { selectorOpen = true }) {
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
                    }
                    HStack {
                        Text("$\(String(format: "%.2f", numAmount * token.price))")
                            .font(.system(size: 13))
                            .foregroundColor(DesignTokens.secondaryText)
                        Spacer()
                        Text("Balance: \(Int(balance))")
                            .font(.system(size: 13))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                }
                .padding(DesignTokens.cardPadding)
                .background(DesignTokens.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.cardRadius))
                
                TextField("Memo (optional)", text: $memo)
                    .font(.system(size: 14))
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.vertical, 10)
                    .background(DesignTokens.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: DesignTokens.cardRadius))
                
                Button(action: {
                    if !appState.connected {
                        appState.connectWallet()
                    } else if !recipient.isEmpty, numAmount > 0, numAmount <= balance, !loading {
                        performSend()
                    }
                }) {
                    HStack {
                        if loading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.9)
                        } else if appState.connected {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 14))
                        }
                        Text(!appState.connected ? "Connect Wallet" : loading ? "Sending…" : "Send \(token.symbol)")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.vertical, 14)
                    .background(canSend ? DesignTokens.ctaButton : Color.gray)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(!canSend && appState.connected)
                
                PoweredByXRPLView(fontSize: 12)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)
                
                if appState.connected, !appState.address.isEmpty {
                    VStack(spacing: 8) {
                        Text("Your receive QR code")
                            .font(.system(size: 13))
                            .foregroundColor(DesignTokens.secondaryText)
                        QRCodeView(content: appState.address, size: 140)
                            .padding(DesignTokens.cardPadding)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.cardRadius))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(DesignTokens.cardPadding)
                }
            }
            .padding(DesignTokens.screenPadding)
        }
        .background(Color.clear)
        .scrollDismissesKeyboard(.interactively)
        .sheet(isPresented: $selectorOpen) {
            TokenSelectorSheet(selected: $token, exclude: "", getBalance: appState.getBalance)
        }
    }
    
    private var canSend: Bool {
        appState.connected && numAmount > 0 && !recipient.isEmpty && numAmount <= balance && !loading
    }
    
    private func performSend() {
        loading = true
        let rec = recipient
        let amt = numAmount
        let tok = token
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            appState.updateBalance(tok.id, -amt)
            loading = false
            amount = ""
            recipient = ""
            memo = ""
            onSuccess(.transfer(token: tok, amount: amt, recipient: rec, txHash: Pools.generateTxHash()))
        }
    }
}
