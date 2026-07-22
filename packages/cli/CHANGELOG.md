# @vyui/cli

## 0.1.2

### Patch Changes

- Add the `lunaris` registry style, and fix four token-layer bugs the audit turned up. ([#154](https://github.com/KealanAU/vyui/pull/154))

  - `lunaris` — the LUNA design system (from [lynx-ui](https://github.com/lynx-family/lynx-ui/tree/main/luna), Apache-2.0) ported to the token layer: pure-grey canvas/paper/content chrome, rose accent, and the five `.luna-gradient-*` classes. A token-only overlay, so every base `.vue` and `theme/*.ts` is reused unchanged. LUNA's neutral variant shares this chrome byte-for-byte and differs only in accent, so it is documented as a delta in the file header rather than shipped as a second style.
  - Fix: `shadcn` and `rounded` held nested `var(--ui-color-*)` refs on the mode tier, which collapse on Lynx native (one level of `var()` only), so consumer-written `bg-primary` / `text-error` painted nothing on device.
  - Fix: `shadcn`'s `primary` now follows `--base-color` like `neutral` does. It was pinned to `zinc` while surfaces tracked the chosen gray, producing combinations shadcn/ui can't express (zinc accent on stone surfaces).
  - Fix: `resolveColorHex` now resolves shade-less colors (`black`, `white`). They are single strings in `tailwindcss/colors`, so indexing them by shade fell through to the slate-500 fallback — a monochrome accent painted black surfaces with slate-blue baked SVG icons on them.
  - Fix: `init` warns when a chosen `--base-color` can't apply because the style ships its own palette, instead of silently ignoring it.
  - Guards: registry tests now assert every shipped style declares the full 120-token surface, declares no nested `var()` value, and that `rounded` differs from the base in `--ui-radius` alone.

  Install with `vyui init --style lunaris`.

## 0.1.1

### Patch Changes

- Add `vyui check` to audit an initialised project for wiring gaps, and teach `init`/`check` about `lynx.config.*` — writing `includeWorkletPackages: ['@vyui/core']` into `pluginVueLynx(...)`. Without it an npm consumer's main-thread worklets never register and gesture-driven components crash at runtime with `cannot read property 'bind' of undefined`. ([#150](https://github.com/KealanAU/vyui/pull/150))

## 0.1.0

### Minor Changes

- 14e0722: Add `@vyui/cli`, a shadcn-style CLI that copies `@vyui/kit` components (and their dependencies) into a project from a style-namespaced registry, rewriting imports to the consumer's aliases.

  - `init` / `add` / `styles` commands; tsconfig/jsconfig alias + package-manager detection.
  - Shadcn-style project preflight and automatic, idempotent app-entry/Tailwind wiring.
  - `list`, `view`, `info`, interactive `add`, and `--dry-run` discovery/preview workflows.
  - Safe upgrades: explicit components may be overwritten while shared files and transitive dependencies remain user-owned.
  - Registry targets are contained to the project root (rejects `../` / absolute / null-byte paths).
  - Cyclic registry dependency graphs resolve instead of deadlocking.

  kit: drive the switch thumb with flex justification instead of `translate-x-*` (Lynx drops `transform` painting), and reset the native `<textarea>` user-agent border.

### Patch Changes

- baf0692: Publish the Vy UI CLI package for registry-backed component installation.
