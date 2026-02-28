import SwiftUI

struct BrandGridView: View {
    @ObservedObject var appState: AppState
    let onSelectToken: (String) -> Void
    
    private let doubledTokens = Token.all + Token.all
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Loyalty Tokens")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(DesignTokens.primaryText)
                Text("Australian brands tokenised on XRPL")
                    .font(.system(size: 14))
                    .foregroundColor(DesignTokens.secondaryText)
            }
            .padding(.horizontal, DesignTokens.screenPadding)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(Array(doubledTokens.enumerated()), id: \.offset) { _, token in
                        BrandCardView(token: token, balance: appState.getBalance(token.id)) {
                            onSelectToken(token.id)
                        }
                    }
                }
                .padding(.horizontal, DesignTokens.screenPadding)
            }
        }
        .padding(.vertical, 24)
    }
}

struct BrandCardView: View {
    let token: Token
    let balance: Double
    let onTap: () -> Void
    
    private var changeClass: String {
        if token.change24h > 0 { return "positive" }
        if token.change24h < 0 { return "negative" }
        return "neutral"
    }
    
    private var changePrefix: String { token.change24h > 0 ? "+" : "" }
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(token.colorLight)
                            .frame(width: 42, height: 42)
                        TokenLogoView(token: token, size: 22)
                    }
                    Spacer()
                    Text("\(changePrefix)\(String(format: "%.1f", token.change24h))%")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(token.change24h > 0 ? Color(hex: "27AE60") : token.change24h < 0 ? Color(hex: "EB5757") : DesignTokens.secondaryText)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background((token.change24h > 0 ? Color(hex: "27AE60") : token.change24h < 0 ? Color(hex: "EB5757") : Color.gray).opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                Text(token.symbol)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(DesignTokens.primaryText)
                Text(token.name)
                    .font(.system(size: 13))
                    .foregroundColor(DesignTokens.secondaryText)
                Text("\(Int(balance)) pts")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(DesignTokens.primaryText)
            }
            .padding(16)
            .frame(minWidth: 220)
            .background(DesignTokens.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}
