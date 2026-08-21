---
"@vyui/core": patch
---

Export the injection-context types that were declared but never re-exported. `injectAccordionRootContext` and 13 siblings were reachable from `@vyui/core` while the type each one returns was not, so consumers building custom parts could call the function but not name its result. Adds `AccordionRootContext`, `DropdownMenu{Root,Sub,CheckboxItem,RadioGroup,RadioItem}Context`, `PinInputRootContext`, `PopoverRootContext`, `SliderRootContext`, `Stepper{Root,Item}Context`, `SwitchRootContext`, `TabsRootContext`, and `ToastRootContext`, plus `ThumbAlignment` (referenced by both `SliderRootProps` and `SliderRootContext`). `RatingRootContext` stays internal — its inject function is not exported either.

Also drops dead weight: the orphaned `Presence/story/_Toggle.vue` and `RadioGroup/story/_Radio.vue` test fixtures (no importer; the live ones are `Toggle/story/_Toggle.vue` and `RadioGroup/story/_RadioGroup.vue`), the `src/test` barrel whose only member was a one-line `sleep` used by a single test, and three unused devDependencies (`@iconify/vue`, `@testing-library/vue`, `@vue/compiler-sfc` — core uses `@iconify/utils`, `@iconify/types`, and `@testing-library/dom`).
