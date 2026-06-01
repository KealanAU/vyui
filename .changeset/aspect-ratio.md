---
"@vyui/core": minor
---

Add AspectRatio — headless `@vyui/core` primitive (`AspectRatioRoot`, exported as both `AspectRatio` and `AspectRatioRoot`) that constrains its default slot to a given `ratio` (number, default `1`).

Ported from reka-ui but adapted for the Lynx render layer: instead of reka-ui's DOM padding-bottom-percentage hack, it renders a single `<view>` using the native CSS `aspect-ratio` property (supported by Lynx's Starlight layout engine), so there is no absolutely-positioned wrapper.
