---
"@vyui/core": patch
---

Add AspectRatio — headless `@vyui/core` primitive (`AspectRatioRoot`, exported as both `AspectRatio` and `AspectRatioRoot`) that constrains its default slot to a given `ratio` (number, default `1`).

Built for the Lynx render layer: it renders a single `<view>` using the native CSS `aspect-ratio` property (supported by Lynx's Starlight layout engine), with no absolutely-positioned padding wrapper.
