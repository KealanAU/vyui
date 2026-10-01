---
"@vyui/core": patch
---

Type main-thread element refs and worklet event handlers with a shared `MTElement` / `MTRef` alias and `@lynx-js/types` event types instead of `any` and `as unknown as` casts. No runtime change.
