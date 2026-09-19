---
"@vyui/kit": patch
---

Bake the Checkbox tick's fill white via the Icon `color` prop — `text-white` on the icon slot never reached the glyph (Lynx rasterizes the svg), so the check rendered black on the colored fill.
