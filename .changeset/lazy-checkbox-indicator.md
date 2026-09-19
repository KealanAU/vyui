---
"@vyui/core": patch
---

Unmount `CheckboxIndicator` immediately when unchecked — it never bound Presence's animation handlers, so the check glyph hung around until Presence's 24-frame watchdog fired (in practice, until the next interaction).
