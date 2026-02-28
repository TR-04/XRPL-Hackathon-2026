import SwiftUI

/// Renders a QR code from a string using CoreImage.
struct QRCodeView: View {
    let content: String
    let size: CGFloat
    
    var body: some View {
        if let image = generateQRCode(from: content) {
            Image(uiImage: image)
                .interpolation(.none)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
        } else {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(hex: "E5E5EA"))
                .frame(width: size, height: size)
                .overlay(
                    Image(systemName: "qrcode")
                        .font(.system(size: 40))
                        .foregroundColor(DesignTokens.secondaryText)
                )
        }
    }
    
    private func generateQRCode(from string: String) -> UIImage? {
        guard let data = string.data(using: .utf8) else { return nil }
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("H", forKey: "inputCorrectionLevel")
        
        guard let outputImage = filter.outputImage else { return nil }
        
        let scale = size / min(outputImage.extent.width, outputImage.extent.height)
        let scaledImage = outputImage.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
        
        let context = CIContext()
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
