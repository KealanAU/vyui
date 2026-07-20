---
"@vyui/kit": patch
---

Select/Combobox selection tick now bakes its fill via the Icon `color` prop (accent ramp) instead of a class the rasterized svg can't receive — it rendered black and vanished in dark mode. Combobox's "No results" text also carries `text-muted` on the `<text>` itself so it flips with the theme.
