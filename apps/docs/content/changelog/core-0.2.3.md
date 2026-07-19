---
title: "@vyui/core v0.2.3"
description: "Button forwards the Lynx tap event through its tap emit (tap: [event: TouchEvent])."
date: "2026-07-19"
package: core
version: "v0.2.3"
changelogOrder: 2003
---

### Patch Changes

- `Button` forwards the Lynx tap event through its `tap` emit (`tap: [event: TouchEvent]`). Previously it emitted bare, so modifier-wrapped listeners merged in via `asChild` — like `ToastClose`'s `@tap.stop` over a button — crashed with `undefined.stopPropagation` on tap, leaving the toast close button broken. ([#137](https://github.com/KealanAU/vyui/pull/137))

- Dead-code audit: remove modules with zero consumers across core, kit, and every example app. ([#138](https://github.com/KealanAU/vyui/pull/138))

  **Breaking** (pre-1.0 patch by repo policy): removes never-used public exports — `withDefault`, `useScrollTo`, and the `components`/`originals`/`utilities` registry — from `@vyui/core`.

  - remove the unexported `shared/color/` module (channel/convert/gradient/parse/utils) — ported for ColorArea/ColorSlider primitives that were never built
  - remove unused `lynx-ui-common` ports: `selector.ts`, `version.ts`, `getEventDetail`, `mainThreadify`, `popoverUtils`, `convertToPx`
  - remove unused reka-ui ports: `useKbd`, `useGraceArea`, `useSelectionBehavior`, `useFormControl`, `isValidVNodeElement`, `withDefault`, `useScrollTo`, `Arrow.vue`, `countryList`
  - remove the hand-maintained `constants.ts` export registry (`components`/`originals`/`utilities` exports)
  - remove the 31 `*.story.vue` files (no story runner exists; `story/_*.vue` test fixtures are untouched)
  - drop the `vue-component-type-helpers` runtime dependency (only importer was `withDefault`)
  - `useId`: drop the Vue <3.5 fallback branch — every workspace pins Vue 3.5+

- Overlay cleanup ahead of the shared-core refactor. ([#143](https://github.com/KealanAU/vyui/pull/143))

  **Breaking** (pre-1.0 patch by repo policy): removes the dead `velocityThreshold` prop from `SheetRoot` (documented as unused/reserved — release logic uses the coast projection) and the consumerless `useSheetBehavior()` reactive wrapper, `progressFor`, `pickSnap`/`PickSnapOpts` (never adopted by Sheet; `pickRelease` is the one release spec), and their types from `@vyui/core`. The pure spec helpers (`pickRelease`, `directionAxis`, `viewportSnapsToPositions`, …) remain.

  - kit `VyModal`: wire the declared-but-dead `dismissible` prop — backdrop taps are now blocked when `false` and emit `close:prevent` (mirrors `VyPopover`)
  - sheet enter/exit keyframes now take their duration from the `duration` prop (inline `animation-duration` longhand) instead of a hardcoded 280ms, fixing the enter/settle desync for consumers like `VyTray` that pass `duration: 300`

- Export `combineGroupState` from Presence and use it in `DialogContent`, deleting the inlined copy that noted "(not exported)". ([#144](https://github.com/KealanAU/vyui/pull/144))

- Remove two unused shared exports that had no consumers. `useStateMachine` (`<Presence>` ships its own 1:1-ported state machine and never used it) is dropped from the public `@vyui/core` entry; `useForwardRef` (superseded by `useForwardExpose`) is dropped from the `@vyui/core/shared` entry. ([#140](https://github.com/KealanAU/vyui/pull/140))

- Require `vue-lynx@^0.4.2` and drop the local worklet-loader patch: upstream #190 now follows aliased and package worklet imports, with `includeWorkletPackages` for `node_modules` consumers. NPM consumers must set `pluginVueLynx({ includeWorkletPackages: ['@vyui/core', '@vyui/kit'] })` — documented in the installation guide. ([#142](https://github.com/KealanAU/vyui/pull/142))
