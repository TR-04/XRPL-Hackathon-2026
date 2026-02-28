import SwiftUI

struct TokenSelectorSheet: View {
    @Binding var selected: Token
    let exclude: String
    var getBalance: ((String) -> Double)?
    @Environment(\.dismiss) var dismiss
    
    private func balance(for token: Token) -> Double {
        getBalance?(token.id) ?? token.userBalance
    }
    
    var body: some View {
        NavigationStack {
            List(Token.all.filter { $0.id != exclude }) { token in
                Button(action: {
                    withAnimation(.easeOut(duration: 0.2)) {
                        selected = token
                    }
                    dismiss()
                }) {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(token.color.opacity(0.2))
                                .frame(width: 40, height: 40)
                            TokenLogoView(token: token, size: 22)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(token.symbol)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(DesignTokens.primaryText)
                            Text(token.name)
                                .font(.system(size: 13))
                                .foregroundColor(DesignTokens.secondaryText)
                        }
                        Spacer()
                        Text(String(format: "%.2f", balance(for: token)))
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Select Token")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(DesignTokens.secondaryText)
                }
            }
        }
    }
}
