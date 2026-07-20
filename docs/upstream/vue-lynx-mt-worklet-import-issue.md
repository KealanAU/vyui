# `worklet-loader-mt`: non-relative imports silently dropped from MT module graph, breaking aliased/package worklets at runtime

## Summary

`extractLocalImports` in `plugin/dist/loaders/worklet-loader-mt.js` builds the main-thread (MT) module graph by re-emitting a processed module's imports as side-effect imports — but it filters specifiers with a regex that requires them to start with `.`. Any import using a path alias (`@/…`, `~/…`, tsconfig `paths`) or a bare package specifier (`@scope/pkg`) is silently excluded. The result is a `'main thread'` worklet that exists in the background bundle but whose `registerWorkletInternal(…)` call is never emitted into the MT bundle; at runtime, `_workletMap[id].bind(this)` throws `TypeError: cannot read property 'bind' of undefined`.

---

## Loader behavior / root cause

- The culprit is `extractLocalImports(source)` in `plugin/dist/loaders/worklet-loader-mt.js`.
- It matches import specifiers using exactly two regexes:
  - `const fromRe = /from\s+['"](\.[^'"]+)['"]/g;`
  - `const bareRe = /import\s+['"](\.[^'"]+)['"]/g;`
- The capture group `(\.[^'"]+)` requires the first character of the specifier to be a literal `.`, so only relative paths (`./foo`, `../bar`) match.
- Path-aliased imports (`@/gesture`, `~/utils`, `#components/…`) and bare package specifiers (`@vyui/core`, `vue-lynx`) are never captured and never re-emitted into the MT module.
- When the MT loader processes a `.vue` SFC or a `.ts` file that *is* reached via a non-relative import, it produces an MT module whose import list is empty — the aliased dependency is simply absent from the MT graph.
- Because the dependency is never listed, `registerWorkletInternal("main-thread", "<id>", …)` for worklets defined in that dependency is never written into the MT bundle.
- At runtime, `_workletMap[id].bind(this)` (in `@lynx-js/react/worklet-runtime/dist/main.js`) throws `TypeError: cannot read property 'bind' of undefined` on the first interaction that triggers the worklet.

---

## Why `sideEffects` / tree-shaking can't fix it

- This is **not** a tree-shaking or `package.json#sideEffects` problem; those mechanisms operate at the bundler stage and cannot fix it.
- The filtering happens at the **loader stage**, when the MT module's import list is generated — one stage before bundling and dead-code elimination run.
- Because the aliased/bare import is never written into the MT module source at all, rspack/webpack's tree-shaking has nothing in the MT graph to evaluate: the import statement doesn't exist to be kept or dropped.
- Therefore, no combination of `sideEffects: false`, `/*#__PURE__*/` annotations, or bundler DCE settings can rescue the registration — the code path is excluded earlier, at import extraction.

---

## Reproduction

- Define a `'main thread'` worklet in a module `gesture.ts` (a touch handler that mutates a `useMainThreadRef` and updates a transform style via `runOnMainThread`).
- Import it into an SFC using a **path alias** configured in tsconfig `paths` (e.g. `import { useGesture } from '@/gesture'`) and bind it with `:main-thread-bindtouchstart`.
- Build and run on device → tap triggers `TypeError: cannot read property 'bind' of undefined`.
- Change **only** the import specifier to a relative path (`import { useGesture } from './gesture'`) — no other code changes — and rebuild → worklet registers and runs correctly.
- Static confirmation (bundle inspection):
  - With alias: the built `main.web.bundle` contains `_workletMap["main-thread/<id>"]` references with no matching `registerWorkletInternal("main-thread","<id>",…)` call (unresolved count > 0).
  - With relative: the same ids appear in the registered set (unresolved count → 0).
- The diagnostic is unambiguous: only the specifier *form* changes; everything else is identical.

---

## Impact

- **Breaks aliased imports (near-universal pattern):** Any shared composable or module that defines `'main thread'` worklets and is consumed via `@/`/tsconfig path aliases — the standard project convention — silently fails at runtime with a confusing low-level error that is far from the root cause.
- **Blocks published component libraries entirely:** A package consumed via a bare specifier (e.g. `@vyui/core`) cannot ship MT worklets to consumers, because the consumer's MT loader skips all imports into that package. A fully general solution needs upstream package traversal / allowlisting. VyUI currently carries a narrow local patch that follows only `@/…` plus `@vyui/core` / `@vyui/kit` imports; it is a stopgap for VyUI consumers, not a general npm-package traversal policy.

---

## Proposed fix

**Tier 1 — aliases (internal projects):**
- Replace the `^\.` regex check with resolution via the bundler's own resolver (webpack/rspack `this.resolve`) or by consulting the configured aliases and tsconfig `paths` directly.
- A minimal variant: also re-emit specifiers matching `@/…` / `~/…` alias patterns — the downstream bundler already knows how to resolve them, so just not filtering them out is enough.
- Note: calling `this.resolve` requires switching the loader to async (`this.async()`), but that is the correct approach for specifier resolution.

**Tier 2 — dependencies (published packages):**
- Extend the MT import traversal to follow resolved imports into worklet-bearing packages, or introduce an opt-in loader option (e.g. `includeWorkletPackages: ['@vyui/core']`) combined with a recognisable registration entry-point that the loader can use to pull in the package's MT worklet registrations for a consumer's build.

---

## VyUI status (as shipped)

`@vyui/core` and `@vyui/kit` now publish **per-file, source-shaped ESM** (Vite lib + Rollup `preserveModules`; see `docs/plans/vite-preserve-modules-dist.md`). Every worklet module ships with direct **named** `vue-lynx` imports and its own pre-compiled `registerWorkletInternal(...)` registrations — the shape the whole MT toolchain assumes. This removes the second failure mode (a bundle's `__WEBPACK_EXTERNAL_MODULE_vue_lynx_*` namespace being orphaned by the consumer's registration slicing). A `check-dist-shape` build gate keeps dist source-shaped.

With source-shaped dist, the **only** remaining consumer-side requirement is the Tier-2 **traversal** fix so the consumer's MT loader walks into `@vyui/*` at all:
- **RESOLVED:** #190 shipped in vue-lynx 0.4.2; the local patch is gone (we're on ^0.4.2). NPM consumers must set `pluginVueLynx({ includeWorkletPackages: ['@vyui/core', '@vyui/kit'] })`. In-repo demos don't need it — they alias `@vyui/*` at workspace source (`apps/examples/_shared/vyui-aliases.ts`), which the loader follows by default.

### Addendum: 0.5.x blocked by a new MT transform regression

Upgrading past 0.4.2 to 0.5.0/0.5.1 breaks the lynx-env build of `packages/core/src/components/Draggable/Draggable.vue`: the generated MT module fails `builtin:swc-loader` parsing with `'import', and 'export' cannot be used outside of module code` at its trailing `export default {};`. 0.4.2 compiles the identical source cleanly.

**Root cause (verified 2026-07-19 against 0.5.1 by running its extraction over the real LEPUS transform output):** 0.5.x rewrote `extractRegistrations`' paren matching from a naive counter to `findBalancedEnd`, which skips `'`/`"`/`` ` `` string literals — but not comments. The SWC LEPUS transform preserves source comments inside registration bodies, so an apostrophe, backtick, or unbalanced paren *inside a body comment* corrupts the scan. In Draggable: registration #7 hits `` `animation: 'none'` `` / `// (the Sheet's touchstart stomp)` in a comment and closes early mid-body (unterminated function → the nested-`export` parse error), and registration #9 returns `-1`, which `break`s the loop and silently drops every later registration. 0.4.2's naive counter was accidentally robust: it counts parens uniformly in code, strings, and comments, and worklet bodies are textually balanced.

The upstream fix is to make `findBalancedEnd` comment-aware (0.5.x already ships an `isInsideComment` helper in the same file, unused here). Until then 0.5.x is blocked repo-wide, not just for demos: our published dist keeps comments inside `registerWorkletInternal(...)` bodies, so npm consumers on a 0.5.x `worklet-loader-mt` would hit the same corruption against `@vyui/*` dist. Re-attempt the bump once fixed upstream — 0.5.x also carries #249 (persisted `Transition` + `v-show`), #201 (comment-anchor suppression), and #203 (programmatic input `setValue`).

**UPDATE (2026-07-20):** bumped to 0.5.1 with a local patch (`patches/vue-lynx@0.5.1.patch`) that adds comment skipping to `findBalancedEnd` in the loader dist. Verified: full build + tests green, `audit-worklet-bundle` clean on kit-demo (158 refs / 0 unresolved) and docs-playground (144 / 0), and a differential check confirms the pristine loader silently drops registrations on a lone-apostrophe comment while the patched one extracts all. The real fix is upstream PR #287 (AST-span extraction via `@babel/parser`); drop the patch and the `patchedDependencies` entry in `pnpm-workspace.yaml` when it ships. Consumer note: peer ranges now allow `^0.4.2 || ^0.5.1`, but consumers on *stock* 0.5.x still corrupt on comments in their own worklet bodies (our dist is mostly comment-stripped by esbuild; `useAnimate.js` keeps a few benign ones) — point them at #287 until it lands.

---

## Environment

- `vue-lynx` 0.4.0
- `@lynx-js/rspeedy` 0.13.6
- `@lynx-js/react` 0.116.5 (provides `worklet-runtime` and `@lynx-js/react/transform`)
- `@lynx-js/types` 3.8.0
