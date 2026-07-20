# @vyui/cli

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
