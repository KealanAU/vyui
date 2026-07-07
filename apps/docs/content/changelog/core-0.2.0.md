---
title: "@vyui/core v0.2.0"
description: "c344b72: Per-component subpath entries for tree-shakeable consumption."
date: "2026-07-06"
package: core
version: "v0.2.0"
changelogOrder: 2000
---

### Minor Changes

- c344b72: Per-component subpath entries for tree-shakeable consumption. `@vyui/kit` now exposes every component as its own entry point (`@vyui/kit/button`, `@vyui/kit/tray`, …) with the same canonical `Vy*` bindings as the barrel, so migrating is a specifier swap. Because the vue-lynx main-thread worklet pipeline prunes by `sideEffects` globs over whatever is _reached_ (bare side-effect imports erase export usage), deep entries are the only way to ship less: importing `@vyui/kit/button` now reaches ~37 modules / 26 worklet registrations instead of the barrel's ~294 / 118.

  To make this work end-to-end, kit's build rewrites its own `@vyui/core` barrel imports to per-file deep specifiers (`@vyui/core/dist/components/….vue.js`), and `@vyui/core` exposes a `./dist/*.js` wildcard export to resolve them. Barrel imports (`import { VyButton } from '@vyui/kit'`) keep working unchanged — they just keep the everything-ships behavior.

  Also fixes `@vyui/kit`'s `sideEffects: false`, which let bundlers drop the package entirely from the vue-lynx main-thread worklet slice (entered via a bare side-effect import that uses no exports), so every transitively-imported `@vyui/core` worklet went unregistered and consumers crashed with `bind of undefined`. Kit now declares the same `sideEffects` globs as core.

- c344b72: Ship per-file, source-shaped ESM dist (Vite lib + Rollup `preserveModules`) instead of an rslib bundle.

  - Fixes the `__WEBPACK_EXTERNAL_MODULE_vue_lynx_* is not defined` main-thread crash for npm consumers of worklet-driven components (VyTray, VyDrawer, Slider, …): worklet modules now keep direct named `vue-lynx` imports the consumer's MT toolchain can follow.
  - Fixes the follow-on `cannot read property 'bind' of undefined` main-thread crash: each pre-compiled worklet module retains a `"main thread"` marker so the consumer's `worklet-loader-mt` extracts its `registerWorkletInternal` calls (with `_wkltId`s matching the background bundle) instead of dropping them. `@vyui/kit`'s `sideEffects` is widened to keep the transitive-core-worklet MT imports from being tree-shaken.
  - SFC `<style>` CSS is now published and auto-imported per module — the old bundle stubbed it, so consumers silently lost component styles.
  - Each SFC ships as a single `X.vue.js`; a `check-dist-shape` guard fails the build on any bundle fingerprint or a worklet module missing its marker.
