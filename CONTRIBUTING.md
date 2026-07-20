# Contributing to Vy UI

> Alpha. Workflow notes here mirror what the maintainers actually run day to day.

## Repo layout

```
packages/
  core/         @vyui/core    — runtime primitives (published to npm)
  kit/          @vyui/kit      — styled components on top of core
  shared-build-config/        — shared Vite build config
  testing-utils/              — shared test helpers
apps/examples/
  kit-demo/         styled-component showcase (exercises @vyui/kit)
  docs-playground/  docs example bundle (live playground sources)
  …                 app-shaped demos (vyai, tiktok-demo, linear-demo, …)
```

Both `@vyui/kit` and `@vyui/core` are aliased straight at workspace **source**
in every demo (`apps/examples/_shared/vyui-aliases.ts`, wired into each
demo's `lynx.config.ts`), so edits to either package show up immediately with
no build step. The alias targets source rather than `dist` specifically so
vue-lynx's MT worklet loader — which only walks relative imports, not
`node_modules` — can reach worklet code; see "Worklet pitfalls" below.

## Local development workflow

1. Clone the repo and install:

   ```bash
   git clone https://github.com/KealanAU/vyui.git
   cd vyui
   pnpm install
   ```

2. Run a demo:

   ```bash
   # Styled-component showcase
   pnpm --filter @vyui/kit-demo dev
   ```

3. Where to test:

   - **`kit-demo`** — styled-component showcase. Use this for `@vyui/kit`
     work and for verifying styled-component output across targets.
   - The app-shaped demos (`vyai`, `tiktok-demo`, `linear-demo`, …) exercise
     component combinations inside real layouts.

4. How to edit core for the demos: edit files in `packages/core/src/`. Every
   demo (including `kit-demo`) picks changes up via the workspace alias
   declared in `source.alias` in its `lynx.config.ts` — no `pnpm build`
   needed for dev iteration.

## Adding a new primitive

1. Run the scaffolding script:

   ```bash
   pnpm new-component <Name>
   ```

2. Edit the generated files. Reference **`Slider`** or **`Checkbox`** for
   canonical patterns — both are stable, both demonstrate the shape we want
   for primitives.

3. Add a section under `apps/examples/kit-demo/src/sections/` and wire it
   into `App.vue`'s tabs to exercise the new component in the live demo.

4. **If the component uses MT worklets** (any `'main thread'` directive):

   - Inline every worklet in one `<script setup>` block. **No cross-file
     `'main thread'` calls** — that bit us a week running.
   - Use **`e.detail.x` / `e.detail.y`** for touch coordinates (Lynx
     convention); not DOM-style `e.touches[0].clientX`.

5. Test:

   ```bash
   pnpm exec vitest run src/components/<Name>
   ```

   from inside `packages/core/`. Write **export tests** in all cases.
   **Render tests for MT-worklet components are currently blocked on the
   MTS test harness** — leave those `.skip` with a comment pointing here.

## Worklet pitfalls (load-bearing — read this before editing any MT component)

These are the recurring footguns. If a worklet-touching change goes sideways,
ninety percent of the time it's one of these:

- The MT worklet walker follows the demos' **source aliases** natively
  (vue-lynx ≥ 0.4.2). Real `node_modules` consumers instead need
  `pluginVueLynx({ includeWorkletPackages: ['@vyui/core', '@vyui/kit'] })` —
  without it, bare `@vyui/*` imports never reach the MT graph and worklets
  crash with `bind of undefined`.
- **Cross-file `'main thread'` calls work but are fragile.** Inline every
  worklet inside the component that uses it.
- **Storing arrow functions in `useMainThreadRef<() => void>` kills the
  worklet binding.** Use a **generation counter for cancellation** instead
  (see `SwiperRoot.vue` for the pattern).
- **`package.json#sideEffects` MUST include** `src/**/*.vue`,
  `src/**/*.ts`, and `dist/**/*.js` for any package whose worklets need to
  reach the MT graph. Don't narrow that list — tree-shaking will eat your
  worklets.

- The consumer's MT slice keeps **only** the `registerWorkletInternal(...)`
  registrations from our dist (no named imports, no module scope). Any free
  identifier in a worklet body that isn't a known MT global is a device-side
  `ReferenceError` — `scripts/native-compat.test.mjs` gates this on every
  `pnpm build` in `packages/core`.
- vue-lynx's loader slices those registrations out of our dist with **text
  scanners** that have repeatedly misread comments/regexes in worklet bodies
  (0.4.2 counts parens in comments; 0.5.x misreads apostrophes). Our build
  strips comments from worklet modules and `native-compat` pins the invariant,
  so published dist is extraction-proof regardless of the consumer's vue-lynx
  version. After **any vue-lynx bump**, run the end-to-end canary before
  device testing: build a demo, then
  `node tools/audit-worklet-bundle.mjs apps/examples/kit-demo/dist/main.web.bundle`
  (fails on any worklet id referenced without a registration).

Related upstream vue-lynx worklet/tree-shaking issues are documented in
`docs/upstream/vue-lynx-mt-worklet-import-issue.md`. If you hit something
that smells related, check that doc first before debugging from scratch.

## Testing

- **All packages:** `pnpm test` (root) runs every package's test suite.
- **All packages typecheck:** `pnpm typecheck` (root).
- **Single package:** `pnpm --filter @vyui/core test` /
  `pnpm --filter @vyui/kit test`.
- **Single component:** `pnpm exec vitest run src/components/<Name>` from
  inside the package.
- **Update snapshots:** `pnpm --filter @vyui/core test-update`.
- **On-device testing:** `pnpm --filter @vyui/kit-demo dev` and scan
  the LAN QR with [Lynx Explorer](https://lynxjs.org/). For a web-only
  preview, open the printed `main.web.bundle` URL.

## What we welcome

- Primitive implementations and behavioral edge cases for `@vyui/core`.
- Lynx-specific platform adjustments (iOS, Android, Web targets).
- Styled component templates for `@vyui/kit` and the future registry.
- Documentation, examples, and starter templates.

## Submitting changes

1. Write a changeset describing the change:

   ```bash
   pnpm exec changeset
   ```

2. For **breaking changes** (major-bump candidates): flag the breaking
   nature in the changeset summary. Reviewers rely on that line.

3. Before opening the PR:

   - `pnpm --filter @vyui/core test` and `pnpm --filter @vyui/kit test`
     (whichever packages you touched).
   - `pnpm --filter <pkg> typecheck` for any package you changed.
   - If you touched `packages/core/src/**`, verify `kit-demo` still runs
     cleanly (the workspace alias picks up your changes with no rebuild).

4. Open a PR. CI will run **build + test + typecheck** on the touched
   packages. Address any failures before requesting review.
