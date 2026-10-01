---
"@vyui/cli": patch
---

Fix `Cannot find module './theme/index.ts'` when Tailwind loads the copied `vyui-preset.js`. `init` and `add` now generate the `theme/index.ts` barrel the preset reads, and registry theme files import their siblings relatively so the preset can load them. Existing projects: re-run `vyui add <components> --overwrite`.
