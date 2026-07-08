# Contributing to Vy UI

> Alpha. Workflow notes here mirror what the maintainers actually run day to day.

## Repo layout

```
packages/
  core/         @vyui/core    — runtime primitives (published to npm)
  ui/           @vyui/kit      — styled components on top of core
  shared-build-config/        — shared rslib / build config
  testing-utils/              — shared test helpers
apps/examples/
  kit-demo/         styled-component showcase (exercises @vyui/kit)
  docs-playground/  docs example bundle (live playground sources)
  …                 app-shaped demos (vyai, tiktok-demo, linear-demo, …)
```

`@vyui/kit` is workspace-linked into the example apps via an alias in
`lynx.config.ts` (it resolves to `packages/kit/src/index.ts`), so edits to UI
source show up immediately in the demo. `@vyui/core` is **not** aliased by
default — example apps depend on the published npm version (`^0.0.2`) so the
pre-compiled MT worklets in `packages/core/dist` ship intact. Aliasing core
to its source path triggers the consumer's vue-lynx worklet loader to re-run,
which historically crashed MT with
`cannot read property 'bind' of undefined`.

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

4. How to edit core for the demos: edit files in `packages/core/src/`. The
   demos pick changes up via the workspace alias declared in their
   `source.alias` in `lynx.config.ts`. No `pnpm build` needed for dev
   iteration in those demos.

   The exception is `kit-demo`, which intentionally depends on the published
   `@vyui/core` (see next section).

## Editing @vyui/core against kit-demo (`dev:local`)

When you need to edit `@vyui/core` source and see it live in `kit-demo`, opt
into the local-core alias:

```bash
# Terminal 1 — watch-build core into packages/core/dist
pnpm --filter @vyui/core dev

# Terminal 2 — run the demo with @vyui/core aliased to local dist
pnpm --filter @vyui/kit-demo dev:local
```

What this does:

- `pnpm --filter @vyui/core dev` runs `rslib build --watch`. Source edits in
  `packages/core/src/**` rebuild into `packages/core/dist/` with worklets
  pre-compiled the same way the npm-published package builds them.
- `dev:local` sets `VYUI_USE_LOCAL_CORE=1`, which flips an alias in
  `apps/examples/kit-demo/lynx.config.ts` to resolve `@vyui/core` imports
  against `packages/core/dist/` instead of `node_modules`.

The alias is gated on the env var, so:

- `pnpm --filter @vyui/kit-demo dev` (no `:local`) → resolves `@vyui/core`
  from the published npm version. Use this when you only care about UI /
  demo source.
- `pnpm --filter @vyui/kit-demo dev:local` → resolves from your local
  `packages/core/dist`. Use this for any core-source change.

Production builds (`pnpm build`) and CI never touch the local alias — they
always pull `^0.0.2` from npm.

### When the local-core flow fails

- **`@vyui/core` doesn't resolve / 404s**: `packages/core/dist/` hasn't been
  built yet. Run `pnpm --filter @vyui/core build` once or start the watcher
  in Terminal 1 first.
- **MT crashes after switching to local**: dist may be stale. Stop the demo,
  delete `packages/core/dist`, re-run the core watcher, then the demo. The
  worklet loader output must come from the rslib chain, not from the
  consumer pipeline.
- **HMR not picking up core changes**: rslib watch writes to disk; the demo's
  dev server picks them up via file-watch. If it stalls, restart the demo
  (`Ctrl-C` then `pnpm dev:local`).

## Adding a new primitive

1. Run the scaffolding script:

   ```bash
   pnpm new-component <Name>
   ```

2. Edit the generated files. Reference **`Slider`** or **`Checkbox`** for
   canonical patterns — both are stable, both demonstrate the shape we want
   for primitives.

3. Add a card to `apps/examples/phase5-debug/src/App.vue` to exercise it
   under the debug sandbox. Each card mounts via `v-if`, so the new
   component can be isolated for bisection.

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

- The `worklet-loader-mt` regex only walks **relative imports** — bare
  `@vyui/core` imports don't propagate to the MT graph. The consumer must
  reach worklet source via a relative path for SWC to follow the chain.
- Every demo entry has a **side-effect relative anchor** at the top of its
  entry file, e.g.
  `import '../../../../packages/core/src'`. **Don't delete it.** Without it
  the MT walker never sees the package and worklets disappear from the MT
  bundle.
- **Cross-file `'main thread'` calls work but are fragile.** Inline every
  worklet inside the component that uses it.
- **Storing arrow functions in `useMainThreadRef<() => void>` kills the
  worklet binding.** Use a **generation counter for cancellation** instead
  (see `SwiperRoot.vue` for the pattern).
- **`package.json#sideEffects` MUST include** `src/**/*.vue`,
  `src/**/*.ts`, and `dist/**/*.js` for any package whose worklets need to
  reach the MT graph. Don't narrow that list — tree-shaking will eat your
  worklets.

Three known vue-lynx footguns are documented in
`~/Desktop/vue-lynx-mt-tree-shake-upstream-fix.md`. If you hit something
that smells related, check that doc first before debugging from scratch.

## Testing

- **All packages:** `pnpm test` (root) runs every package's test suite.
- **All packages typecheck:** `pnpm typecheck` (root).
- **Single package:** `pnpm --filter @vyui/core test` /
  `pnpm --filter @vyui/kit test`.
- **Single component:** `pnpm exec vitest run src/components/<Name>` from
  inside the package.
- **Update snapshots:** `pnpm --filter @vyui/core test-update`.
- **On-device testing:** `pnpm --filter @vyui/phase5-debug dev` and scan
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
   - If you touched `packages/core/src/**`, verify the demo runs cleanly
     via `dev:local` against your fresh dist.

4. Open a PR. CI will run **build + test + typecheck** on the touched
   packages. Address any failures before requesting review.
