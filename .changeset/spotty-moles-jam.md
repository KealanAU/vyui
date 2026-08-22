---
"@vyui/core": patch
"@vyui/kit": patch
---

Merge `SliderHorizontal` / `SliderVertical` into one `SliderOrientation`
component. The orientation context loses `direction` (provided by both, read by
nobody) and `size`, which was non-reactive and whose two readers already had the
same information in `startEdge` — so orientation now survives a live switch
instead of being frozen at mount.

Expose `hitSlop` on `SliderRoot` and `VySlider` (default `"16px"`, unchanged).
It widens the native touch target a drag can start from; it does not widen the
element's box, so growing the root's cross-axis padding is still the sturdier
fix when an ancestor `<scroll-view>` claims a vertical drag.
