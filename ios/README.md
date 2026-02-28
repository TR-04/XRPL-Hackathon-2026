# LoyaltySwap iOS App

Native SwiftUI iOS app implementing the swap interface design. Viewable in Xcode and runs on iPhone Simulator or device.

## Opening in Xcode

```bash
open ios/LoyaltySwap.xcodeproj
```

1. Select **iPhone 14 Pro** or **iPhone 16 Pro** from the device dropdown
2. Press **⌘R** to build and run

## Design

- **Layout:** Fixed header, scrollable swap content, persistent 5-tab bottom nav
- **Colors:** Light mode — `#F2F2F7` background, `#FFFFFF` cards, `#1A1A1A` CTAs
- **Typography:** SF Pro system font, 12–34pt hierarchy
- **Components:** Swap panels, slide-to-swap CTA with holographic thumb, fee/rate rows
- **Transitions:** Spring animations on tab switches, token swap, and slide gesture

## Structure

```
ios/
├── LoyaltySwap.xcodeproj/
├── LoyaltySwap/
│   ├── LoyaltySwapApp.swift
│   ├── Models/Token.swift
│   ├── Design/DesignTokens.swift
│   ├── Views/
│   │   ├── SwapHeaderView.swift
│   │   ├── SwapCardView.swift
│   │   ├── SlideToSwapButton.swift
│   │   ├── SwapView.swift
│   │   ├── TokenSelectorSheet.swift
│   │   └── MainTabView.swift
│   └── Assets.xcassets/
```
