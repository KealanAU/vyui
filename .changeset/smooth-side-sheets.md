---
"@vyui/core": patch
"@vyui/kit": patch
---

Add side-aware sheet and drawer motion. `SheetRoot` now accepts `side` for top, right, bottom, and left edge placement with matching slide animations and drag-to-dismiss physics. `VyDrawer` forwards its side to the core sheet, and sheet-backed kit components can opt into alternate edges.

Edge placement and the enter/leave slide keyframes key off a `vyui-sheet__content--{side}` class rather than a `[data-side]` attribute selector, so they apply on Lynx native (which does not match attribute selectors in CSS) — restoring the open/close animation on device.
