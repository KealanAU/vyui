---
title: "@vyui/kit v0.3.10"
description: "Rename VyActionSheet to VyDrawer — proper and clearer naming for the edge-sheet component."
date: "2026-08-13"
package: kit
version: "v0.3.10"
changelogOrder: 3010
---

### Patch Changes

- Rename `VyActionSheet` to `VyDrawer` — proper and clearer naming for the edge-sheet component. `VyDrawer` gains `v-model` support (the `modelValue` alias alongside `v-model:open`), `handleOnly`, and `#header`/`#body`/`#footer` slots. The `@vyui/kit/action-sheet` export is gone; migrate to `VyDrawer`. ([#188](https://github.com/KealanAU/vyui/pull/188))

  Fix `defaultOpen` on `SheetRoot` (and other `default*` props via `useStandardVModel`): vue-lynx normalizes unset booleans to `false`, so controlled/uncontrolled detection now reads the raw vnode props instead of checking `=== undefined`.

- Remove documented-but-dead API surface. ([#190](https://github.com/KealanAU/vyui/pull/190))

  **Breaking:** `openAutoFocus` and `closeAutoFocus` are removed from `DialogContent` / `AlertDialogContent` (no focus model on Lynx, so they never fired). `escapeKeyDown` is removed from `DismissableLayerEmits` and `useDismissableLayer` (`onEscapeKeyDown` gone — drop the destructured handler if you use it). The `ScrollView` `debugLog` prop is removed (never read). Consumers relying on these get a compile error on upgrade, not a silent no-op.

  `VyToggle`'s default slot now forwards `{ modelValue, state, pressed, disabled }` exactly like the core primitive so those documented slot props actually arrive.

- Scope the alpha status notice in both package READMEs. The blanket "expect breaking changes on every release" was doing the libraries a disservice — the component surface has held steady across `@vyui/core` `0.2.x` and `@vyui/kit` `0.3.x`, and the breaking changes to date removed unused exports rather than reshaping APIs. The notice now says that, and points at the pre-alpha Vue-Lynx runtime underneath as the part that can still move. ([#183](https://github.com/KealanAU/vyui/pull/183))

- Make the Slider drag far more forgiving. The control now carries `hit-slop` and claims every slide angle, so a press no longer has to land inside the track's own thickness and an ancestor `<scroll-view>` no longer steals the gesture when the finger drifts off-axis. On Lynx web — which re-targets pointer events by position — a viewport-sized shield is raised for the length of a mouse drag, so the cursor can leave the control without stranding it. The kit theme pads the slider on its cross axis to give the thumb a finger-sized target. ([#193](https://github.com/KealanAU/vyui/pull/193))

- Fix the docs/playground build failing on `VyToggle`: vue-loader can't resolve `ToggleProps`'s base type across the package boundary, so the `extends` is marked `/* @vue-ignore */`. The inherited props are fallthrough attrs at runtime either way. ([#194](https://github.com/KealanAU/vyui/pull/194))

- `VyToggle`'s `ToggleProps` now extends the core primitive's props, so `as`, `asChild`, and `defaultValue` get real TypeScript/IDE support. They already worked at runtime via `$attrs` fall-through; this only closes the typing gap. ([#191](https://github.com/KealanAU/vyui/pull/191))

- Fix `VyToggle` having no visible on-state. The `ghost` default variant only carried `active:` classes, so its pressed surface vanished the moment the tap ended, and the pressed/unpressed `text-*` classes on the icon slot never reached the rasterized SVG. Every variant now paints a resting pressed surface, and the icon fill is baked per state (`iconFg`), matching `VyToggleGroup`. The default slot gains `iconColor` for custom SVG icons. ([#192](https://github.com/KealanAU/vyui/pull/192))

- Updated dependencies [[`26d99df`](https://github.com/KealanAU/vyui/commit/26d99df0cc20362e352951598dc1ba622ad86681), [`9cb3eda`](https://github.com/KealanAU/vyui/commit/9cb3edacb5c0205c1658b414ee5eedc4ef5ff8e2), [`992ce21`](https://github.com/KealanAU/vyui/commit/992ce21d18a68715f5261e61ea13e16c95f09a34), [`18d5762`](https://github.com/KealanAU/vyui/commit/18d57628d1159ffcfe49e424ae23aeff2548d52d)]:
  - @vyui/core@0.2.10
