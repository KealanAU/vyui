---
"@vyui/kit": minor
"@vyui/core": patch
---

Add `VyTray` — a morphing, multi-view bottom sheet built on the core `Sheet` primitives. Views (`VyTrayView`) are measured per screen and the panel animates its height to fit whichever is showing ("grows into place"), with a back stack (`useTray().goBack` / `canGoBack`), a persistent `#footer` slot, and `floating` (detached card) vs `flush` (edge-anchored) variants.

`@vyui/core` `SheetContent` gains a `fitContent` prop that sizes the panel to its natural content height instead of a `snapPoints × viewport` fraction — the drag/slide/backdrop physics reuse the measured height, so nothing else changes. This is the mode `VyTray` builds on.
