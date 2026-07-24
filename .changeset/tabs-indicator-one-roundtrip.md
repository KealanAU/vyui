---
"@vyui/core": patch
---

Cache the TabsIndicator list rect and re-measure it only on layout/orientation/dir changes, so a tab switch costs one `boundingClientRect` round-trip instead of two.
