---
title: "@vyui/kit v0.3.8"
description: "Paint overlays above app content on Lynx web: OverlayBackdrop defaults to z-index: 1000 and ToastViewport to 1100, so an OverlayRoot mounted as the app root'…"
date: "2026-07-27"
package: kit
version: "v0.3.8"
changelogOrder: 3008
---

### Patch Changes

- Paint overlays above app content on Lynx web: `OverlayBackdrop` defaults to `z-index: 1000` and `ToastViewport` to `1100`, so an `OverlayRoot` mounted as the app root's first child no longer renders modals behind the page. ([#167](https://github.com/KealanAU/vyui/pull/167))

- Updated dependencies [[`9e57049`](https://github.com/KealanAU/vyui/commit/9e57049a3519b606add6d974fd5431965a45e886)]:
  - @vyui/core@0.2.8
