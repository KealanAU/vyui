---
title: "@vyui/core v0.2.9"
description: "Drop the redundant @vueuse/shared dependency — @vueuse/core already re-exports it (export  from '@vueuse/shared'), so the two reactivePick/reactiveOmit impor…"
date: "2026-08-04"
package: core
version: "v0.2.9"
changelogOrder: 2009
---

### Patch Changes

- Drop the redundant `@vueuse/shared` dependency — `@vueuse/core` already re-exports it (`export * from '@vueuse/shared'`), so the two `reactivePick`/`reactiveOmit` imports now come from `@vueuse/core` directly. ([#173](https://github.com/KealanAU/vyui/pull/173))

- Better access to the native-host seams: ([#177](https://github.com/KealanAU/vyui/pull/177))

  - `@vyui/core`: new `useGlobalEvent(name, listener, { immediate })` — subscribe to `GlobalEventEmitter` events with lifecycle cleanup (now backing keyboard, exposure, and lazy-component internals) — and `getViewportSize()` — the LynxView size in logical px from `SystemInfo` (now backing Sheet/ScrollView viewport estimates).
  - `@vyui/kit`: `useColorMode()` in `'system'` mode now reads the host's `theme: "light" | "dark"` global prop at boot and follows live `themechanged` global events, so native apps can drive dark mode from the device appearance.

- `Primitive` now omits `undefined`-valued attributes instead of forwarding them to the renderer, matching Vue's DOM semantics. ([#179](https://github.com/KealanAU/vyui/pull/179))

  vue-lynx's `patchProp` has no nullish guard, so an `undefined` attr was patched like any other: it crossed the op bridge as JSON (`undefined` → `null` in the ops array) and landed as `__SetAttribute(el, key, null)` — a native prop-reset for a prop that was never set. A stock `Textarea` emitted ~11 of these per mount. An explicit `null` still reaches the element, and clearing a prop at runtime is unaffected.

  Alongside it, `Textarea` no longer applies a `maxLength` of `140` by default. The prop is now unset, leaving the platform's own limit in place — unlimited on iOS and Android, `140` on Harmony. Pass an explicit value to enforce a limit or to get identical behavior on every platform.
