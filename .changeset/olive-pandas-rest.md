---
"@vyui/core": patch
---

Remove unreferenced internals: the `_ConfigProvider.vue` demo scrap, 11 orphaned `story/*.vue` fixtures, the `shared/component` barrel (`BaseSeparator.vue` itself is unchanged and still imported directly), the unused `handleSubmit` test helper, and the unused `TAP_THRESHOLD` constant. `_Switch.vue` moves into `Switch/story/` so it stops leaking a generated API page into the docs site. No published runtime export changes.
