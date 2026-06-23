---
"@vyui/cli": minor
"@vyui/kit": patch
---

Add `@vyui/cli`, a shadcn-style CLI that copies `@vyui/kit` components (and their dependencies) into a project from a style-namespaced registry, rewriting imports to the consumer's aliases.

- `init` / `add` / `styles` commands; tsconfig/jsconfig alias + package-manager detection.
- Registry targets are contained to the project root (rejects `../` / absolute / null-byte paths).
- Cyclic registry dependency graphs resolve instead of deadlocking.

kit: drive the switch thumb with flex justification instead of `translate-x-*` (Lynx drops `transform` painting), and reset the native `<textarea>` user-agent border.
