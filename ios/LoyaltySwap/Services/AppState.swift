import SwiftUI

class AppState: ObservableObject {
    @Published var connected = false
    @Published var connecting = false
    @Published var connectStatus = ""
    @Published var address = ""
    @Published var xrpBalance = "0"
    @Published var backendOnline = false
    @Published var balances: [String: Double] = [:]
    
    init() {
        Token.all.forEach { balances[$0.id] = $0.userBalance }
    }
    
    func connectWallet() {
        connecting = true
        connectStatus = "Creating XRPL wallet…"
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.address = "rDemoFallback000000000000000000000"
            self.xrpBalance = "10.5"
            Token.all.forEach { self.balances[$0.id] = $0.userBalance }
            self.connected = true
            self.connectStatus = ""
            self.connecting = false
        }
    }
    
    func disconnectWallet() {
        connected = false
        address = ""
        xrpBalance = "0"
    }
    
    func getBalance(_ tokenId: String) -> Double {
        balances[tokenId] ?? 0
    }
    
    func updateBalance(_ tokenId: String, _ delta: Double) {
        balances[tokenId] = max(0, (balances[tokenId] ?? 0) + delta)
    }
    
    var truncatedAddress: String {
        guard address.count > 10 else { return address }
        return "\(address.prefix(6))...\(address.suffix(4))"
    }
}
