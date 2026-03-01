import SwiftUI

struct WithdrawView: View {
    @ObservedObject var appState: AppState
    let onSuccess: (SuccessData) -> Void
    
    @State private var token = Token.all[0]
    @State private var amount = ""
    @State private var destination = ""
    @State private var memo = ""
    @State private var selectorOpen = false
    @State private var showWithdrawInfo = false
    @State private var loading = false
    
    private var numAmount: Double { Double(amount) ?? 0 }
    private var balance: Double { appState.getBalance(token.id) }
    
    private var canWithdraw: Bool {
        appState.connected && numAmount > 0 && !destination.isEmpty && numAmount <= balance && !loading
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Withdraw Tokens")
                        .font(.system(size: 22, weight: .semibold))
                    Spacer()
                    Button(action: { showWithdrawInfo = true }) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 20))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .buttonStyle(.plain)
                }
                .alert("How withdraw works", isPresented: $showWithdrawInfo) {
                    Button("OK", role: .cancel) { }
                } message: {
                    Text("Send your minted loyalty tokens to an external XRPL wallet. Enter the destination address and amount — tokens transfer instantly on the XRPL.")
                }
                
                Text("Send your minted loyalty tokens to an external XRPL wallet.")
                    .font(.system(size: 14))
                    .foregroundColor(DesignTokens.secondaryText)
                
                TextField("Destination XRPL address (r...)", text: $destination)
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
                            .disabled(loading)
                        Button(action: { if !loading { selectorOpen = true } }) {
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
                        .disabled(loading)
                    }
                    HStack {
                        Text("$\(String(format: "%.2f", numAmount * token.price)) value")
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
                    } else if canWithdraw {
                        performWithdraw()
                    }
                }) {
                    HStack {
                        if loading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.9)
                        } else if appState.connected {
                            Image(systemName: "arrow.down.to.line")
                                .font(.system(size: 14))
                        }
                        Text(!appState.connected ? "Connect Wallet" : loading ? "Withdrawing…" : "Withdraw \(token.symbol)")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.vertical, 14)
                    .background(canWithdraw ? Color(hex: "F59E0B") : Color.gray)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(!canWithdraw && appState.connected)
                
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
    
    private func performWithdraw() {
        loading = true
        let dest = destination
        let amt = numAmount
        let tok = token
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            appState.updateBalance(tok.id, -amt)
            loading = false
            amount = ""
            destination = ""
            memo = ""
            onSuccess(.withdraw(token: tok, amount: amt, destination: dest, txHash: Pools.generateTxHash()))
        }
    }
}
