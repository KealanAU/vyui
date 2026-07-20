---
"@vyui/core": patch
---

Tabs indicator no longer animates growing in from zero width on mount / CSS reload — the transition now arms one tick after the first measurement, so only genuine tab switches slide.
