import SwiftUI

/// Displays token logo from Assets.xcassets/TokenLogos, with emoji fallback.
struct TokenLogoView: View {
    let token: Token
    var size: CGFloat = 22
    
    var body: some View {
        if let img = UIImage(named: token.id, in: .main, with: nil) {
            Image(uiImage: img)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .clipShape(RoundedRectangle(cornerRadius: size * 0.2))
        } else {
            Text(token.emoji)
                .font(.system(size: size))
        }
    }
}
