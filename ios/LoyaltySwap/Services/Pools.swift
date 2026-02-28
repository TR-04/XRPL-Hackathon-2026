import Foundation

struct Pools {
    static func getQuote(fromTokenId: String, toTokenId: String, amountIn: Double) -> (amountOut: Double, path: [String], rate: Double, fee: Double)? {
        guard fromTokenId != toTokenId, amountIn > 0 else { return nil }
        let fromToken = Token.all.first { $0.id == fromTokenId }
        let toToken = Token.all.first { $0.id == toTokenId }
        guard let from = fromToken, let to = toToken else { return nil }
        let rate = to.price / from.price
        let amountOut = amountIn * rate * 0.994
        let path = [fromTokenId, "XRP", toTokenId]
        let fee = amountIn * 0.003 * 2
        return (amountOut, path, amountOut / amountIn, fee)
    }
    
    static func generateTxHash() -> String {
        let chars = "0123456789ABCDEF"
        return (0..<64).map { _ in String(chars.randomElement()!) }.joined()
    }
}
