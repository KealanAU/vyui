---
"@vyui/core": patch
---

Drop the `@vueuse/core` runtime dependency. Five helpers were in use: `useVModel`
now ships as an internal composable (`clone` / `eventName` / `shouldEmit` and the
implicit `getCurrentInstance` emit are gone — nothing used them), and
`unrefElement`, `useMounted`, `reactiveOmit` and `reactivePick` are inlined at
their call sites. `@vyui/core` is a Lynx runtime with no DOM, so a DOM-shaped
dependency is one fewer thing for the main-thread bundle to reach.
