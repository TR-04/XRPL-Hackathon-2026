import SwiftUI

struct Token: Identifiable {
    let id: String
    let symbol: String
    let name: String
    let emoji: String
    let color: Color
    let colorLight: Color
    let price: Double
    let change24h: Double
    var userBalance: Double
    
    static let all: [Token] = [
        Token(id: "mMacca", symbol: "mMacca", name: "Macca's Rewards", emoji: "🍔", color: Color(hex: "FFC107"), colorLight: Color(hex: "FFF8E1"), price: 0.80, change24h: 1.2, userBalance: 2500),
        Token(id: "mQantas", symbol: "mQantas", name: "Qantas Frequent Flyer", emoji: "✈️", color: Color(hex: "E40000"), colorLight: Color(hex: "FFF0F0"), price: 1.00, change24h: 2.0, userBalance: 800),
        Token(id: "mJetstar", symbol: "mJetstar", name: "Jetstar Rewards", emoji: "🛩️", color: Color(hex: "FF6600"), colorLight: Color(hex: "FFF3E6"), price: 0.95, change24h: -1.0, userBalance: 0),
        Token(id: "mGYG", symbol: "mGYG", name: "GYG Rewards", emoji: "🌮", color: Color(hex: "F5A623"), colorLight: Color(hex: "FFF9EE"), price: 0.45, change24h: 5.0, userBalance: 1200),
        Token(id: "mApple", symbol: "mApple", name: "Apple Rewards", emoji: "🍎", color: Color(hex: "555555"), colorLight: Color(hex: "F5F5F5"), price: 2.50, change24h: 0.0, userBalance: 500),
        Token(id: "mKmart", symbol: "mKmart", name: "Kmart Rewards", emoji: "🏬", color: Color(hex: "E3000B"), colorLight: Color(hex: "FFF0F0"), price: 0.10, change24h: -3.0, userBalance: 300),
        Token(id: "mWoolies", symbol: "mWoolies", name: "Woolworths Rewards", emoji: "🛒", color: Color(hex: "1B8C1B"), colorLight: Color(hex: "F0FDF0"), price: 0.02, change24h: 1.0, userBalance: 4500)
    ]
}
