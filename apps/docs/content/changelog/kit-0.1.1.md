---
title: @vyui/kit v0.1.1
description: bb4d208: Add VyTray — a morphing, multi-view bottom sheet built on the core Sheet primitives.
date: 2026-07-04
package: kit
version: v0.1.1
---

### Patch Changes

- bb4d208: Add `VyTray` — a morphing, multi-view bottom sheet built on the core `Sheet` primitives. Views (`VyTrayView`) are measured per screen and the panel animates its height to fit whichever is showing ("grows into place"), with a back stack (`useTray().goBack` / `canGoBack`), a persistent `#footer` slot, and `floating` (detached card) vs `flush` (edge-anchored) variants.

  `@vyui/core` `SheetContent` gains a `fitContent` prop that sizes the panel to its natural content height instead of a `snapPoints × viewport` fraction — the drag/slide/backdrop physics reuse the measured height, so nothing else changes. This is the mode `VyTray` builds on.

- 31c2202: Add side-aware sheet and drawer motion. `SheetRoot` now accepts `side` for top, right, bottom, and left edge placement with matching slide animations and drag-to-dismiss physics. `VyDrawer` forwards its side to the core sheet, and sheet-backed kit components can opt into alternate edges.

  Edge placement and the enter/leave slide keyframes key off a `vyui-sheet__content--{side}` class rather than a `[data-side]` attribute selector, so they apply on Lynx native (which does not match attribute selectors in CSS) — restoring the open/close animation on device.

- Updated dependencies [bb4d208]
- Updated dependencies [31c2202]
  - @vyui/core@0.1.1
