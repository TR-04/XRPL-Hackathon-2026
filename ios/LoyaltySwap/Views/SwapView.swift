import SwiftUI

struct SwapView: View {
    @ObservedObject var appState: AppState
    let onSuccess: (SuccessData) -> Void
    
    @State private var fromToken = Token.all[0]
    @State private var toToken = Token.all[1]
    @State private var amount = ""
    @State private var showFromSelector = false
    @State private var showToSelector = false
    @State private var showSwapConfirmSheet = false
    @State private var showSwapInfo = false
    @State private var loading = false
    
    private var numAmount: Double { Double(amount) ?? 0 }
    private var quote: (amountOut: Double, path: [String], rate: Double, fee: Double)? {
        Pools.getQuote(fromTokenId: fromToken.id, toTokenId: toToken.id, amountIn: numAmount)
    }
    private var insufficientBalance: Bool { numAmount > appState.getBalance(fromToken.id) }
    
    private func getButtonText() -> String {
        if !appState.connected { return "Connect Wallet" }
        if amount.isEmpty || numAmount <= 0 { return "Enter an amount" }
        if insufficientBalance { return "Insufficient \(fromToken.symbol) balance" }
        if loading { return "Swapping…" }
        return "Swap"
    }
    
    private var isButtonDisabled: Bool {
        if !appState.connected { return false }
        return amount.isEmpty || numAmount <= 0 || insufficientBalance || loading
    }
    
    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .center) {
                    Text("Swap")
                        .font(.system(size: 22, weight: .semibold))
                    Spacer()
                    Button(action: { showSwapInfo = true }) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 20))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .buttonStyle(.plain)
                }
                .alert("How it works", isPresented: $showSwapInfo) {
                    Button("OK", role: .cancel) { }
                } message: {
                    Text("Swap loyalty points instantly between Australian brands tokenised on XRPL.")
                }
                
                // Merged You pay + You receive in one div with swap icon centered
                VStack(spacing: 0) {
                    // You pay section
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("You pay")
                                .font(.system(size: 13))
                                .foregroundColor(DesignTokens.secondaryText)
                            Spacer()
                            Text("Balance: \(Int(appState.getBalance(fromToken.id)))")
                                .font(.system(size: 12))
                                .foregroundColor(DesignTokens.secondaryText)
                            Text("MAX")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(DesignTokens.primaryText)
                                .onTapGesture { amount = String(Int(appState.getBalance(fromToken.id))) }
                        }
                        HStack {
                            TextField("0", text: $amount)
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundColor(DesignTokens.primaryText)
                                .keyboardType(.decimalPad)
                            Button(action: { showFromSelector = true }) {
                                HStack(spacing: 6) {
                                    TokenLogoView(token: fromToken, size: 20)
                                    Text(fromToken.symbol)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(DesignTokens.primaryText)
                                    Image(systemName: "chevron.down")
                                        .font(.system(size: 10))
                                        .foregroundColor(DesignTokens.secondaryText)
                                }
                                .padding(.vertical, 6)
                                    .padding(.horizontal, 10)
                                .background(Color(hex: "F5F5F5"))
                                .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.top, 24)
                    .padding(.bottom, 20)
                    
                    // Swap icon in middle
                    Button(action: {
                        let t = fromToken
                        fromToken = toToken
                        toToken = t
                        amount = ""
                    }) {
                        ZStack {
                            Circle()
                                .fill(Color(hex: "E8EEF5"))
                                .frame(width: 44, height: 44)
                            if let img = UIImage(named: "SwapIcon", in: .main, with: nil) {
                                Image(uiImage: img)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(width: 24, height: 24)
                            } else {
                                Image(systemName: "arrow.down")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(DesignTokens.primaryText)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    
                    // You receive section
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("You receive")
                                .font(.system(size: 13))
                                .foregroundColor(DesignTokens.secondaryText)
                            Spacer()
                            Text("Balance: \(Int(appState.getBalance(toToken.id)))")
                                .font(.system(size: 12))
                                .foregroundColor(DesignTokens.secondaryText)
                        }
                        HStack {
                            Text(quote != nil ? String(format: "%.2f", quote!.amountOut) : "0")
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundColor(DesignTokens.secondaryText)
                            Spacer()
                            Button(action: { showToSelector = true }) {
                                HStack(spacing: 6) {
                                    TokenLogoView(token: toToken, size: 20)
                                    Text(toToken.symbol)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(DesignTokens.primaryText)
                                    Image(systemName: "chevron.down")
                                        .font(.system(size: 10))
                                        .foregroundColor(DesignTokens.secondaryText)
                                }
                                .padding(.vertical, 6)
                                    .padding(.horizontal, 10)
                                .background(Color(hex: "F5F5F5"))
                                .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.top, 20)
                    .padding(.bottom, 24)
                }
                .background(DesignTokens.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.cardRadius))
                
                // Connect Wallet / Swap button - right underneath You receive
                Button(action: {
                    if !appState.connected {
                        appState.connectWallet()
                    } else if !isButtonDisabled {
                        showSwapConfirmSheet = true
                    }
                }) {
                    HStack {
                        if loading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.9)
                        }
                        Text(getButtonText())
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, DesignTokens.cardPadding)
                    .padding(.vertical, 14)
                    .background(isButtonDisabled ? Color.gray : DesignTokens.ctaButton)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(isButtonDisabled)
                
                PoweredByXRPLView(fontSize: 11)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)
                
                // Quote info (compact)
                if let q = quote, numAmount > 0 {
                    HStack {
                        Text("1 \(fromToken.symbol) = \(String(format: "%.4f", q.rate)) \(toToken.symbol)")
                            .font(.system(size: 12))
                            .foregroundColor(DesignTokens.secondaryText)
                        Spacer()
                        Text("Fee: ~0.00001 XRP")
                            .font(.system(size: 12))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .padding(.horizontal, 4)
                    .padding(.top, 4)
                }
                
                Spacer(minLength: 4)
            }
            .padding(DesignTokens.screenPadding)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.clear)
        .scrollDismissesKeyboard(.interactively)
        .sheet(isPresented: $showFromSelector) {
            TokenSelectorSheet(selected: $fromToken, exclude: toToken.id, getBalance: appState.getBalance)
        }
        .sheet(isPresented: $showToSelector) {
            TokenSelectorSheet(selected: $toToken, exclude: fromToken.id, getBalance: appState.getBalance)
        }
        .sheet(isPresented: $showSwapConfirmSheet) {
            SlideToConfirmView(
                isPresented: $showSwapConfirmSheet,
                title: "Confirm Swap",
                subtitle: "Slide to confirm swapping \(Int(numAmount)) \(fromToken.symbol) for \(quote.map { String(format: "%.2f", $0.amountOut) } ?? "0") \(toToken.symbol)",
                icon: "arrow.left.arrow.right",
                onConfirm: { performSwap() }
            )
        }
    }
    
    private func performSwap() {
        guard let q = quote, numAmount > 0, numAmount <= appState.getBalance(fromToken.id) else { return }
        let amountIn = numAmount
        let amountOut = q.amountOut
        let from = fromToken
        let to = toToken
        let path = q.path
        loading = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
            appState.updateBalance(from.id, -amountIn)
            appState.updateBalance(to.id, amountOut)
            loading = false
            amount = ""
            onSuccess(.swap(
                fromToken: from,
                toToken: to,
                amountIn: amountIn,
                amountOut: amountOut,
                txHash: Pools.generateTxHash(),
                path: path
            ))
        }
    }
}

enum SuccessData {
    case swap(fromToken: Token, toToken: Token, amountIn: Double, amountOut: Double, txHash: String, path: [String])
    case transfer(token: Token, amount: Double, recipient: String, txHash: String)
    case withdraw(token: Token, amount: Double, destination: String, txHash: String)
    case mint(token: Token, amount: Double, txHash: String)
}
