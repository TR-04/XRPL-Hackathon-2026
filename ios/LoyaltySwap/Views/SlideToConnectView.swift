import SwiftUI

/// iOS-style slide-to-confirm for trades and actions.
struct SlideToConfirmView: View {
    @Binding var isPresented: Bool
    let title: String
    let subtitle: String
    let icon: String
    let onConfirm: () -> Void
    
    @State private var slideOffset: CGFloat = 0
    @State private var isComplete = false
    
    private let trackHeight: CGFloat = 56
    private let thumbSize: CGFloat = 48
    private let padding: CGFloat = 4
    
    var body: some View {
        VStack(spacing: 24) {
            HStack {
                Spacer()
                Button(action: { isPresented = false }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(DesignTokens.secondaryText)
                }
                .padding(.trailing, DesignTokens.screenPadding)
            }
            
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 44))
                    .foregroundColor(DesignTokens.ctaButton)
                Text(title)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(DesignTokens.primaryText)
                Text(subtitle)
                    .font(.system(size: 14))
                    .foregroundColor(DesignTokens.secondaryText)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .padding(.bottom, 8)
            
            GeometryReader { geo in
                let maxSlide = geo.size.width - thumbSize - padding * 4
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: trackHeight / 2)
                        .fill(Color(hex: "E5E5EA"))
                        .frame(height: trackHeight)
                    
                    Text("Slide to confirm")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(DesignTokens.secondaryText)
                        .frame(maxWidth: .infinity)
                    
                    HStack {
                        ZStack {
                            RoundedRectangle(cornerRadius: thumbSize / 2)
                                .fill(
                                    LinearGradient(
                                        colors: [DesignTokens.ctaButton, DesignTokens.ctaButton],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: thumbSize, height: thumbSize)
                                .shadow(color: .black.opacity(0.15), radius: 4, x: 0, y: 2)
                            
                            Image(systemName: "arrow.right")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.white)
                        }
                        .offset(x: padding + slideOffset)
                        .gesture(
                            DragGesture()
                                .onChanged { value in
                                    if !isComplete {
                                        slideOffset = min(max(0, value.translation.width), maxSlide)
                                    }
                                }
                                .onEnded { value in
                                    if !isComplete {
                                        if slideOffset >= maxSlide - 10 {
                                            completeSlide()
                                        } else {
                                            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                                                slideOffset = 0
                                            }
                                        }
                                    }
                                }
                        )
                        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: slideOffset)
                        
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, padding)
                }
                .frame(height: trackHeight)
            }
            .frame(height: trackHeight)
            .padding(.horizontal, DesignTokens.screenPadding)
            
            Spacer()
        }
        .padding(.top, 20)
        .background(DesignTokens.pageBackground)
    }
    
    private func completeSlide() {
        isComplete = true
        onConfirm()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            isPresented = false
        }
    }
}
