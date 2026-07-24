---
"@vyui/core": patch
"@vyui/kit": patch
"@vyui/cli": patch
---

Repo-wide over-engineering cleanup. Migrate all 38 `@vyui/kit` components off the internal `defineThemeBuilder` helper onto the existing `useStyledComponent` composable and delete the helper. Remove dead code from `@vyui/core` (the `useWarning` no-op, and the unused `areEqual`/`findValuesBetween`/`mtsLog`/`get`/`noop` utils) and simplify `handleAndDispatchCustomEvent`. In `@vyui/cli`, drop the fuzzy "did you mean" suggestion from the unknown-component error (which already lists every available component) and simplify dependency resolution. No public component API changes.
