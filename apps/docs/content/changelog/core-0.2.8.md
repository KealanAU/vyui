---
title: "@vyui/core v0.2.8"
description: "Paint overlays above app content on Lynx web: OverlayBackdrop defaults to z-index: 1000 and ToastViewport to 1100, so an OverlayRoot mounted as the app root'…"
date: "2026-07-27"
package: core
version: "v0.2.8"
changelogOrder: 2008
---

### Patch Changes

- Paint overlays above app content on Lynx web: `OverlayBackdrop` defaults to `z-index: 1000` and `ToastViewport` to `1100`, so an `OverlayRoot` mounted as the app root's first child no longer renders modals behind the page. ([#167](https://github.com/KealanAU/vyui/pull/167))
