---
"@vyui/core": patch
"@vyui/kit": patch
---

Rename `VyActionSheet` to `VyDrawer` — proper and clearer naming for the edge-sheet component. `VyDrawer` gains `v-model` support (the `modelValue` alias alongside `v-model:open`), `handleOnly`, and `#header`/`#body`/`#footer` slots. The `@vyui/kit/action-sheet` export is gone; migrate to `VyDrawer`.

Fix `defaultOpen` on `SheetRoot` (and other `default*` props via `useStandardVModel`): vue-lynx normalizes unset booleans to `false`, so controlled/uncontrolled detection now reads the raw vnode props instead of checking `=== undefined`.
