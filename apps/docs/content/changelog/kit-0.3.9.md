---
title: "@vyui/kit v0.3.9"
description: "Better access to the native-host seams:"
date: "2026-08-04"
package: kit
version: "v0.3.9"
changelogOrder: 3009
---

### Patch Changes

- Better access to the native-host seams: ([#177](https://github.com/KealanAU/vyui/pull/177))

  - `@vyui/core`: new `useGlobalEvent(name, listener, { immediate })` — subscribe to `GlobalEventEmitter` events with lifecycle cleanup (now backing keyboard, exposure, and lazy-component internals) — and `getViewportSize()` — the LynxView size in logical px from `SystemInfo` (now backing Sheet/ScrollView viewport estimates).
  - `@vyui/kit`: `useColorMode()` in `'system'` mode now reads the host's `theme: "light" | "dark"` global prop at boot and follows live `themechanged` global events, so native apps can drive dark mode from the device appearance.

- Updated dependencies [[`53e4159`](https://github.com/KealanAU/vyui/commit/53e4159718bc943ceccaa377f26d39cd80bb5bb6), [`639c9ad`](https://github.com/KealanAU/vyui/commit/639c9adace53183e0963d087ff278749106b3192), [`0112442`](https://github.com/KealanAU/vyui/commit/0112442b4ecc00de8e2787995d1475461d159120)]:
  - @vyui/core@0.2.9
