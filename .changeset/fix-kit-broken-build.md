---
"@vyui/kit": patch
---

Fix broken package build: components were emitted as self-importing wrappers, so `import { Button } from '@vyui/kit'` resolved to `undefined` (shipped in 0.0.4). The build now bundles from explicit named entries and is guarded by a packed-tarball smoke test.

- `provideVyUI(app, options)` provides theme config without registering every component (tree-shaking-friendly); `app.use(VyUI, { components })` registers a chosen subset.
- `exports` list `types` before `import`; add a `prepublishOnly` build guard.
