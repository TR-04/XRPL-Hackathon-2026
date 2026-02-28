import SwiftUI

struct NavbarView: View {
    @ObservedObject var appState: AppState
    
    var body: some View {
        HStack(spacing: 12) {
            if let img = UIImage(named: "Logo", in: .main, with: nil) {
                Image(uiImage: img)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 36, height: 36)
                    .padding(6)
                    .frame(width: 48, height: 48)
                    .background(DesignTokens.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            Spacer()
            
            if appState.connected {
                Button(action: { appState.disconnectWallet() }) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(DesignTokens.ctaButton)
                            .frame(width: 20, height: 20)
                        Text(appState.truncatedAddress)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(DesignTokens.primaryText)
                        Text("(\(appState.xrpBalance) XRP)")
                            .font(.system(size: 12))
                            .foregroundColor(DesignTokens.secondaryText)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12))
                            .foregroundColor(DesignTokens.secondaryText)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(DesignTokens.cardBackground)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            } else {
                Button(action: { appState.connectWallet() }) {
                    HStack(spacing: 6) {
                        if appState.connecting {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text(appState.connectStatus.isEmpty ? "Connecting…" : appState.connectStatus)
                                .font(.system(size: 14, weight: .medium))
                        } else {
                            Image(systemName: "wallet.pass.fill")
                                .font(.system(size: 14))
                            Text("Connect Xaman")
                                .font(.system(size: 14, weight: .medium))
                        }
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(DesignTokens.ctaButton)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(appState.connecting)
            }
        }
        .padding(.horizontal, DesignTokens.screenPadding)
        .frame(height: DesignTokens.headerHeight)
    }
}
