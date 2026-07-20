---
"@vyui/cli": patch
---

Add `vyui check` to audit an initialised project for wiring gaps, and teach `init`/`check` about `lynx.config.*` — writing `includeWorkletPackages: ['@vyui/core']` into `pluginVueLynx(...)`. Without it an npm consumer's main-thread worklets never register and gesture-driven components crash at runtime with `cannot read property 'bind' of undefined`.
