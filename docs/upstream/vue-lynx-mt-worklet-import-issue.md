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
- **Blocks published component libraries entirely:** A package consumed via a bare specifier (e.g. `@vyui/core`) cannot ship MT worklets to consumers, because the consumer's MT loader skips all imports into that package. There is no viable workaround for real consumers; a relative side-effect import pointing into `node_modules` is not a publishable solution.

---

## Proposed fix

**Tier 1 — aliases (internal projects):**
- Replace the `^\.` regex check with resolution via the bundler's own resolver (webpack/rspack `this.resolve`) or by consulting the configured aliases and tsconfig `paths` directly.
- A minimal variant: also re-emit specifiers matching `@/…` / `~/…` alias patterns — the downstream bundler already knows how to resolve them, so just not filtering them out is enough.
- Note: calling `this.resolve` requires switching the loader to async (`this.async()`), but that is the correct approach for specifier resolution.

**Tier 2 — dependencies (published packages):**
- Extend the MT import traversal to follow resolved imports into worklet-bearing packages, or introduce an opt-in loader option (e.g. `includeWorkletPackages: ['@vyui/core']`) combined with a recognisable registration entry-point that the loader can use to pull in the package's MT worklet registrations for a consumer's build.

---

## Environment

- `vue-lynx` 0.4.0
- `@lynx-js/rspeedy` 0.13.6
- `@lynx-js/react` 0.116.5 (provides `worklet-runtime` and `@lynx-js/react/transform`)
- `@lynx-js/types` 3.8.0
