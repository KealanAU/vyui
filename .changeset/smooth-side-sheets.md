---
"@vyui/core": patch
"@vyui/kit": patch
---

Add side-aware sheet and drawer motion. `SheetRoot` now accepts `side` for top, right, bottom, and left edge placement with matching slide animations and drag-to-dismiss physics. `VyDrawer` forwards its side to the core sheet, and sheet-backed kit components can opt into alternate edges.
