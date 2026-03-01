import SwiftUI

struct SuccessOverlayView: View {
    let data: SuccessData?
    let onClose: () -> Void
    
    @State private var copied = false
    
    var body: some View {
        if data == nil { EmptyView() }
        else {
        ZStack {
            Color.black.opacity(0.5)
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "27AE60"))
                        .frame(width: 64, height: 64)
                    Image(systemName: "checkmark")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.white)
                }
                
                Text(title)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(DesignTokens.primaryText)
                
                Text(subtitle)
                    .font(.system(size: 14))
                    .foregroundColor(DesignTokens.secondaryText)
                    .multilineTextAlignment(.center)
                
                if case .swap = data {
                    EmptyView()
                } else {
                    Button(action: {
                        UIPasteboard.general.string = txHashString
                        copied = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
                    }) {
                        Text(copied ? "✓ Copied!" : "TX: \(txHashShort)")
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(DesignTokens.primaryText)
                    }
                }
                
                Button(action: onClose) {
                    Text("Done")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 24)
                        .background(DesignTokens.ctaButton)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
            .padding(24)
            .background(DesignTokens.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .padding(32)
        }
        }
    }
    
    private var title: String {
        guard let d = data else { return "" }
        switch d {
        case .transfer: return "Transfer Sent!"
        case .withdraw: return "Withdrawal Complete!"
        case .mint: return "Tokens Minted!"
        case .swap: return "Swap Successful!"
        }
    }
    
    private var subtitle: String {
        guard let d = data else { return "" }
        switch d {
        case .transfer(let token, let amount, _, _):
            return "\(Int(amount)) \(token.symbol) sent"
        case .withdraw(let token, let amount, let dest, _):
            let destShort = dest.count > 18 ? "\(dest.prefix(8))...\(dest.suffix(6))" : dest
            return "\(Int(amount)) \(token.symbol) withdrawn to \(destShort)"
        case .mint(let token, let amount, _):
            return "\(Int(amount)) \(token.symbol) minted to your wallet"
        case .swap(let from, let to, let amountIn, let amountOut, _, _):
            return "Swapped \(Int(amountIn)) \(from.symbol) for \(Int(amountOut)) \(to.symbol)"
        }
    }
    
    private var txHashString: String {
        guard let d = data else { return "" }
        switch d {
        case .transfer(_, _, _, let h): return h
        case .withdraw(_, _, _, let h): return h
        case .mint(_, _, let h): return h
        case .swap(_, _, _, _, let h, _): return h
        }
    }
    
    private var txHashShort: String {
        let h = txHashString
        guard h.count > 24 else { return h }
        return "\(h.prefix(16))...\(h.suffix(8))"
    }
}
