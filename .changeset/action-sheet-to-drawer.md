---
"@vyui/core": patch
"@vyui/kit": minor
---

BREAKING (kit): Remove `VyActionSheet` in favour of `VyDrawer`. ActionSheet was a bottom-only item list; Drawer is the nuxt.ui-parity edge sheet (`#content`/`#header`/`#body`/`#footer` slots, `title`/`description`/`direction`/`overlay`/`dismissible`/`handle`/`handleOnly`, `v-model` + `v-model:open`). `VyActionSheet` and the `@vyui/kit/action-sheet` export are gone; migrate to `VyDrawer`. Add `handleOnly` to `VyDrawer` (nuxt.ui parity).

fix (core): `useStandardVModel`/`useStandardVModelOf` no longer treat unset boolean props as controlled. vue-lynx normalizes unset booleans to `false`, so the old `props.open === undefined` check was never true and `defaultOpen` (and other `default*`) were dead on `SheetRoot` and elsewhere — the component was pinned to its default and could never be written uncontrolled. Detection now reads the raw vnode props; writing works and `defaultOpen` seeds initial state.
