---
"@vyui/core": patch
---

Dead-code audit: remove modules with zero consumers across core, kit, and every example app.

**Breaking** (pre-1.0 patch by repo policy): removes never-used public exports — `withDefault`, `useScrollTo`, and the `components`/`originals`/`utilities` registry — from `@vyui/core`.

- remove the unexported `shared/color/` module (channel/convert/gradient/parse/utils) — ported for ColorArea/ColorSlider primitives that were never built
- remove unused `lynx-ui-common` ports: `selector.ts`, `version.ts`, `getEventDetail`, `mainThreadify`, `popoverUtils`, `convertToPx`
- remove unused reka-ui ports: `useKbd`, `useGraceArea`, `useSelectionBehavior`, `useFormControl`, `isValidVNodeElement`, `withDefault`, `useScrollTo`, `Arrow.vue`, `countryList`
- remove the hand-maintained `constants.ts` export registry (`components`/`originals`/`utilities` exports)
- remove the 31 `*.story.vue` files (no story runner exists; `story/_*.vue` test fixtures are untouched)
- drop the `vue-component-type-helpers` runtime dependency (only importer was `withDefault`)
- `useId`: drop the Vue <3.5 fallback branch — every workspace pins Vue 3.5+
