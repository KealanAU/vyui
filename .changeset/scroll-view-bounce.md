---
"@vyui/core": patch
---

ScrollView: add a main-thread custom bounce/overscroll system.

New props mirroring lynx-ui's bounce surface: `enableBounces`,
`singleSidedBounce` (`'upper' | 'lower' | 'both' | 'iOSBounces' | 'none'`),
`alwaysBouncing`, `startBounceTriggerDistance` / `endBounceTriggerDistance`,
`estimatedHeight` / `estimatedWidth`, and `enableRTL`. Adds `upperBounceItem` /
`lowerBounceItem` slots for user-supplied overscroll indicators and an
`onScrollToBounces` (`{ direction: 'upper' | 'lower' }`) event, with bounce
gesture and animation driven on the main thread via the new `useBounce`
composable. Preserves the `android-touch-slop` and BTS name-flush workarounds
so events aren't dropped.
