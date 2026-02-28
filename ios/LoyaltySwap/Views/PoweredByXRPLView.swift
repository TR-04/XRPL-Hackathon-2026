import SwiftUI

/// "powered by XRPL Ledger" text.
struct PoweredByXRPLView: View {
    var fontSize: CGFloat = 12
    
    var body: some View {
        HStack(spacing: 4) {
            Text("powered by")
                .font(.system(size: fontSize))
                .foregroundColor(DesignTokens.secondaryText)
            Text("XRP Ledger")
                .font(.system(size: fontSize, weight: .bold))
                .foregroundColor(DesignTokens.secondaryText)
        }
    }
}
