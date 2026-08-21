---
"@vyui/core": patch
---

Remove `interpolate`, `interpolateJS`, `Extrapolation`, `ExtrapolationConfig`, and `ExtrapolationType`. `interpolate` carried a `'main thread'` directive, and cross-file worklet-to-worklet calls do not resolve — so the gesture worklets that need a clamped lerp could never call it, in this repo or a consumer's. Its only working path was a background-to-main-thread hop, which defeats the 60fps case it existed for. The background variant was callable but unused, and its shared enum only served the pair. Removes exported members from `@vyui/core/shared`.
