import SwiftUI

enum DesignTokens {
    // Colors - Design Spec
    static let pageBackground = Color(hex: "F2F2F7")
    static let pageBackgroundGradient = LinearGradient(
        colors: [Color(hex: "E8E6D5"), Color(hex: "D8D6E8"), Color(hex: "B8B8D0")],
        startPoint: .top,
        endPoint: .bottom
    )
    static let cardBackground = Color.white
    static let primaryText = Color.black
    static let secondaryText = Color(hex: "8E8E93")
    static let maxButtonBg = Color(hex: "1A1A1A")
    static let maxButtonText = Color.white
    static let ctaButton = Color(hex: "1A1A1A")
    static let ctaText = Color.white
    static let swapButtonBg = Color.white
    static let swapIconColor = Color(hex: "1A1A1A")
    static let notificationBadge = Color(hex: "FF3B30")
    static let addressBarBg = Color.white
    
    // Sizing
    static let screenPadding: CGFloat = 20
    static let cardRadius: CGFloat = 24
    static let cardPadding: CGFloat = 22
    static let headerHeight: CGFloat = 52
    static let avatarSize: CGFloat = 36
    static let badgeSize: CGFloat = 16
    static let swapButtonSize: CGFloat = 44
    static let tokenIconSize: CGFloat = 38
    static let ctaHeight: CGFloat = 58
    static let tabBarHeight: CGFloat = 56
    
    // Animation
    static let transitionDuration: Double = 0.35
    static let springResponse: Double = 0.4
    static let springDamping: Double = 0.8
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
