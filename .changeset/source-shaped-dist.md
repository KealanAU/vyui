---
"@vyui/core": minor
"@vyui/kit": minor
---

Ship per-file, source-shaped ESM dist (Vite lib + Rollup `preserveModules`) instead of an rslib bundle.

- Fixes the `__WEBPACK_EXTERNAL_MODULE_vue_lynx_* is not defined` main-thread crash for npm consumers of worklet-driven components (VyTray, VyDrawer, Slider, …): worklet modules now keep direct named `vue-lynx` imports the consumer's MT toolchain can follow.
- Fixes the follow-on `cannot read property 'bind' of undefined` main-thread crash: each pre-compiled worklet module retains a `"main thread"` marker so the consumer's `worklet-loader-mt` extracts its `registerWorkletInternal` calls (with `_wkltId`s matching the background bundle) instead of dropping them. `@vyui/kit`'s `sideEffects` is widened to keep the transitive-core-worklet MT imports from being tree-shaken.
- SFC `<style>` CSS is now published and auto-imported per module — the old bundle stubbed it, so consumers silently lost component styles.
- Each SFC ships as a single `X.vue.js`; a `check-dist-shape` guard fails the build on any bundle fingerprint or a worklet module missing its marker.
