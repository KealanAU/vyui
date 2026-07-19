---
"@vyui/core": patch
"@vyui/kit": patch
---

Require `vue-lynx@^0.4.2` and drop the local worklet-loader patch: upstream #190 now follows aliased and package worklet imports, with `includeWorkletPackages` for `node_modules` consumers. NPM consumers must set `pluginVueLynx({ includeWorkletPackages: ['@vyui/core', '@vyui/kit'] })` — documented in the installation guide.
