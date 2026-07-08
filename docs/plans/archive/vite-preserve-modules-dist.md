# Plan: per-file source-shaped dist for `@vyui/core` + `@vyui/kit` (Vite/Rollup `preserveModules`)

Status: implemented · Owner: Kealan · Written: 2026-07-06

## Implementation notes (what actually shipped vs. this plan)

- **Core + kit migrated** to Vite lib + Rollup `preserveModules` (`vite@7`, `@vitejs/plugin-vue@6`). rslib configs + `scripts/worklet-loader.cjs` deleted; `@rslib/core` / `@rsbuild/plugin-vue` dropped.
- Shared build helpers live in `@vyui/shared-build-config`: `vite-vue-options`, `vite-worklet-plugin` (port of the webpack loader), `vite-prune-vue-facades`, `vite-sfc-css-imports`, and `scripts/check-dist-shape.mjs`.
- **Spike risk #1 (directives):** esbuild preserves `"main thread"`; the worklet plugin runs `enforce: 'post'` (after esbuild) and consumes it. Resolved.
- **Spike risk #2 (facades):** plugin-vue emits a redundant `?vue&type=script` re-export sub-module per SFC. The real component always lands at `X.vue.js`; `vyui-prune-vue-facades` deletes the unreferenced, side-effect-free re-export facades (only scoped-style SFCs whose script is a live dep keep a second file). Resolved.
- **Spike risk #3 (CSS):** Vite lib extraction strips the per-module CSS side-effect import; `vyui-sfc-css-imports` re-attaches it from `chunk.viteMetadata.importedCss`. SFC styles are now published *and* auto-loaded.
- **New bug found + fixed:** `inlineRuntimeGate` left a dead `var loadWorkletRuntime = __loadWorkletRuntime;` alias that rspack DCE used to drop; under preserveModules Rollup reduces it to a bare `__loadWorkletRuntime;` that throws `ReferenceError` at load. The gate now strips the alias too.
- **Phase 0 descoped:** shipped the always-on static guard (`check-dist-shape`, wired into both `build-only` and thus CI, with a red-before/green-after unit test) instead of a full rspeedy consumer-app fixture. The guard fails on the exact Tray-bug fingerprint (`__WEBPACK_EXTERNAL_MODULE_*`, orphaned `_workletMap` refs, namespace `vue-lynx` imports) on every build, with zero extra toolchain. A device-building rspeedy fixture remains a possible future add.
- **Second consumer root cause found (2026-07-06), post-migration:** `@vyui/kit`'s `sideEffects: false` elided the *bare* MT side-effect import chain (`import '@vyui/kit'` emitted by the consumer's worklet-loader-mt uses zero exports), orphaning every transitively-imported core worklet. Kit's `sideEffects` now mirrors core's globs (see the `//sideEffects` note in its package.json) — required for ANY package on the bare-import chain, worklets of its own or not.
- **Follow-on: per-component subpath entries (tree-shaking recovery).** The MT loader erases export usage, so pruning is `sideEffects`-glob-based over whatever is *reached* — with the widened globs, one barrel import ships the whole library in both BG bundle and MT slice. Deep entries shrink the reached set instead: `gen-subpath-entries.mjs` emits `dist/entries/<kebab>.js` per component (canonical `Vy*` bindings; synced into kit `exports`), and `rewrite-deep-imports.mjs` re-points kit dist's `@vyui/core` barrel imports at the defining files (resolved from core's own barrel; fails the build on unmapped shapes), with core exposing a `./dist/*.js` wildcard export. Measured: `@vyui/kit/button` reaches 37 modules / 26 MT registrations vs 294 / 118 through the barrel.

## Why

Consumer-side `main-thread.js` crashes (`ReferenceError: __WEBPACK_EXTERNAL_MODULE_vue_lynx_dbb0f2d9__ is not defined`, `bind of undefined` variants) are caused by publishing rslib **bundles**: vue-lynx becomes a webpack external namespace, `runOnBackground`/`runOnMainThread` call sites become `(0, NS.fn)(...)` inside worklet bodies, and the consumer's `worklet-loader-mt` textually slices `registerWorkletInternal(...)` out of the LEPUS output — keeping the namespace references but dropping the import. Reproduced by running the patched loader on `core/dist/index.js`: 159 registrations, 20 orphaned namespace refs, no import.

Upstream vue-lynx PR #190 fixes MT graph *traversal* only (aliases / `includeWorkletPackages`). It does **not** make bundled dist safe. The durable fix is shipping dist in the shape the whole MT toolchain assumes: per-file ESM with direct named `vue-lynx` imports.

**rspeedy is unaffected.** It is the app bundler; dist on npm is plain ESM consumed by whatever bundler the app uses. Demos don't even consume dist (`apps/examples/_shared/vyui-aliases.ts` aliases `@vyui/*` at workspace `src/`).

Confidence in the Vite pipeline:
- vitest already runs `@vitejs/plugin-vue` over every core SFC daily (`packages/core/vitest.config.ts`).
- reka-ui (core's upstream source) publishes via Vite lib mode + `preserveModules`.
- The old kit bundleless failure (SFC wrapper chunk vs script chunk both named `<Name>.js`, see `packages/kit/rslib.config.ts` comment) does not exist under Rollup: plugin-vue resolves the virtual sub-modules internally and `preserveModules` emits **one flat module per SFC** (`X.vue.js`).

Bonus fix: the current bundle **stubs SFC `<style>` CSS** (`"./src/.../presence.css": function() {}` in dist) — npm consumers silently lose component CSS (e.g. `.vyui-sheet__backdrop` first-open-flash rules). Per-file emit ships it properly.

## Target dist contract

Every published JS file must be:
- one flat module per source file; SFCs as `components/X/Y.vue.js` (script + render fn, no `?vue&type=*` sub-module imports)
- direct **named** imports from `vue-lynx`/`vue`; relative internal imports (consumer MT loader follows these natively)
- `'main thread'` directives preserved verbatim (consumer MT loader keys on them)
- hybrid worklet pre-compile applied per file (`registerWorkletInternal` + inlined `globalThis.lynxWorkletImpl` gate) — **required**: the consumer's BG-side worklet loader excludes `node_modules` with no allowlist, so dist must self-register on BG
- es2022, no minify, no identifier mangling, zero `__WEBPACK_EXTERNAL_MODULE_*`

## Phase 0 — build the guard first: consumer tarball smoke test

Build the detector before changing anything, so the migration is proven by the check that would have caught the Tray bug. Must be **red** against current dist, **green** after.

- `fixtures/consumer-smoke/`: minimal rspeedy app (repo convention: type-lock fixtures live in top-level `fixtures/`) importing `VyTray` + `VyDrawer` (kit) and a core worklet component (e.g. Slider); installs `pnpm pack` tarballs of core+kit; uses the patched vue-lynx.
- Build it, then assert on the emitted `main-thread.js`:
  1. no `__WEBPACK_EXTERNAL_MODULE_*` identifier without a defining import in the same file
  2. every `_workletMap["main-thread/<id>"]` reference has a matching `registerWorkletInternal("main-thread", "<id>", ...)`
  3. BG bundle contains the package's registrations (hybrid gate working)
- Wire into CI.

## Phase 1 — core: Vite build spike

`packages/core/vite.config.ts`:
- `build.lib`: entries `{ index, internal, 'date/index', 'shared/index' }` (mirror `package.json#exports`), `formats: ['es']`, `minify: false`
- `rollupOptions.external`: everything in deps + peers (`vue`, `vue-lynx`, `/^@lynx-js\//`, `/^@vueuse\//`, `/^@iconify/`, `/^@internationalized\//`, `ohash`, `tailwind-merge`, `vue-component-type-helpers`)
- `rollupOptions.output`: `preserveModules: true`, `preserveModulesRoot: 'src'`, `entryFileNames: '[name].js'`
- `@vitejs/plugin-vue` with `template.compilerOptions: { isNativeTag: () => true, whitespace: 'condense', hoistStatic: false }` — port of `vueLynxLoaderOptions` (`isServerBuild`/`experimentalInlineMatchResource` are webpack-vue-loader-only; drop). Add a Vite-flavored export to `@vyui/shared-build-config`.
- Port `scripts/worklet-loader.cjs` → Rollup plugin (`enforce: 'post'`, `transform(code, id)` on compiled-SFC + `.ts` containing `'main thread'`): same `transformReactLynxSync` hybrid emit + `inlineRuntimeGate`.
- Add `scripts/check-dist-shape.mjs` (keep permanently, run in `build`): asserts the "Target dist contract" greps above.

Spike risk items (resolve before Phase 2):
1. **Directive survival**: verify `'main thread'` survives Vite's esbuild TS transform. If esbuild drops non-`use strict` prologue directives → use an swc/plain-tsc transform for worklet-bearing files, or run the worklet pre-compile after esbuild.
2. **Output naming**: expect `X.vue.js` — already matches `sideEffects` glob (`**/*.vue.js`) and the existing per-file d.ts tree (`dist/components/**/X.vue.d.ts` from vue-tsc). Verify no facade/interop wrappers appear.
3. **SFC styles**: `cssCodeSplit` + preserveModules should emit per-module `.css` + side-effect import; verify a consumer rspeedy build ingests css imports from node_modules (vue-lynx plugin CSS rules). If it fights back, ship JS fix first and handle CSS as a follow-up — do not let CSS block the worklet fix (current behavior already loses CSS, so stubbing is non-regressing).
4. **Define flags**: check src for `__DEV__` / env define usage and replicate whatever the rslib config injected.

## Phase 2 — swap core build

- `build-only` → `vite build`; keep `build-types` (vue-tsc + tsc-alias + add-dts-extensions + check-dts) and `smoke-test` untouched — the d.ts pipeline is already per-file and needs no change.
- Delete `packages/core/rslib.config.ts` (removes the stale `bundle: false` comment with it); drop `@rslib/core` + `@rsbuild/plugin-vue` devDeps; pin `vite` to the version vitest already resolves (see the dual-vite `as any` note in `vitest.config.ts`).
- Phase 0 smoke must go green for the core path.

## Phase 3 — kit

- Same config shape, entries `{ index, 'theme/index', tailwind, config }`. Kit has zero `'main thread'` today, but wire the worklet plugin anyway (existing config comment mandates parity with core).
- Replace the chunk-collision rationale comment in `packages/kit/rslib.config.ts` history — the collision doesn't exist under Rollup preserveModules.
- Phase 0 smoke green for Tray/Drawer specifically (the original bug).

## Phase 4 — cleanup + docs

- Update `docs/upstream/vue-lynx-mt-worklet-import-issue.md`: dist is now source-shaped; consumer requirement is only the traversal fix (patch now, `includeWorkletPackages: ['@vyui/core', '@vyui/kit']` once #190 ships).
- Changeset (minor, core+kit): per-file source-shaped ESM dist; fixes MT worklet ReferenceError for npm consumers; SFC styles now published.
- Keep `patches/vue-lynx@0.4.0.patch` until #190 merges — the MT-rule node_modules carve-out and edge-follow are still needed; the dist shape change removes only the orphaned-namespace crash.
- Suggested #190 follow-up (separate): loader `emitError` when a sliced registration references `__WEBPACK_EXTERNAL_MODULE_*` with no matching emitted import — turns this whole bug class into a build-time error upstream.

## Non-goals

- No demo/rspeedy config changes (they alias src; expect zero diff).
- Do not remove the hybrid pre-compile (BG loader has no node_modules allowlist).
- Not blocked on #190.
