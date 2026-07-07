---
"@vyui/kit": patch
---

`VyInput` now paints its colored border plus a shadow-ring while focused (tracked in JS — Lynx has no `:focus-within`), instead of only via the static `highlight` prop. The ring is a flat arbitrary `box-shadow` (`0 0 0 2px var(--ui-color-{color}-200)`) because the Lynx preset has no `ring*`/`boxShadowColor` plugins; the per-color classes are safelisted in the Tailwind preset. `highlight` still forces the same treatment on permanently.
