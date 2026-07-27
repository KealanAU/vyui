---
"@vyui/core": patch
---

Drop the redundant `@vueuse/shared` dependency — `@vueuse/core` already re-exports it (`export * from '@vueuse/shared'`), so the two `reactivePick`/`reactiveOmit` imports now come from `@vueuse/core` directly.
