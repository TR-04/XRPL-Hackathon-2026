import SwiftUI

struct MainTabView: View {
    @StateObject private var appState = AppState()
    @State private var selectedTab = "Swap"
    @State private var successData: SuccessData?
    
    var body: some View {
        ZStack {
            DesignTokens.pageBackgroundGradient
                .ignoresSafeArea(edges: .all)
            
            VStack(spacing: 0) {
                NavbarView(appState: appState)
                
                Group {
                    switch selectedTab {
                    case "Swap":
                        SwapView(appState: appState, onSuccess: { successData = $0 })
                    case "Transfer":
                        P2PTransferView(appState: appState, onSuccess: { successData = $0 })
                    case "Deposit":
                        DepositView(appState: appState, onSuccess: { successData = $0 })
                    default:
                        SwapView(appState: appState, onSuccess: { successData = $0 })
                    }
                }
                .id(selectedTab)
                .transition(.opacity)
                .animation(.easeOut(duration: 0.12), value: selectedTab)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Bottom nav - 3 tabs
                HStack(spacing: 0) {
                    NavItem(icon: "arrow.left.arrow.right", customImageName: nil, label: "Swap", isSelected: selectedTab == "Swap") {
                        selectedTab = "Swap"
                    }
                    NavItem(icon: "paperplane.fill", customImageName: nil, label: "Send", isSelected: selectedTab == "Transfer") {
                        selectedTab = "Transfer"
                    }
                    NavItem(icon: "qrcode", customImageName: "DepositIcon", customImageSize: 26, label: "Deposit", isSelected: selectedTab == "Deposit") {
                        selectedTab = "Deposit"
                    }
                }
                .padding(.vertical, 12)
                .background(Color.clear)
            }
            
            if successData != nil {
                SuccessOverlayView(data: successData, onClose: { successData = nil })
            }
        }
    }
}

struct NavItem: View {
    let icon: String
    var customImageName: String? = nil
    var customImageSize: CGFloat = 22
    let label: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 5) {
                ZStack {
                    if isSelected {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 44, height: 44)
                    }
                    if let name = customImageName, let img = UIImage(named: name, in: .main, with: nil) {
                        Image(uiImage: img.withRenderingMode(.alwaysTemplate))
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: customImageSize, height: customImageSize)
                            .foregroundColor(isSelected ? DesignTokens.ctaButton : DesignTokens.secondaryText)
                    } else {
                        Image(systemName: icon)
                            .font(.system(size: 22))
                            .foregroundColor(isSelected ? DesignTokens.ctaButton : DesignTokens.secondaryText)
                    }
                }
                Text(label)
                    .font(.system(size: 13, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? DesignTokens.primaryText : DesignTokens.secondaryText)
            }
            .frame(maxWidth: .infinity)
            .animation(.easeOut(duration: 0.12), value: isSelected)
        }
        .buttonStyle(.plain)
    }
}
