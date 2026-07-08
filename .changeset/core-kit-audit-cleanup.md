---
"@vyui/core": patch
"@vyui/kit": patch
---

Cleanup pass: dead code removal, export gaps, and a color-parsing bug fix.

- `@vyui/core`: export `ConfigProvider` from the public API — `useLocale`/`useDirection` depend on its context but had no supported way to provide it
- `@vyui/core`: remove the disposable `useMtSmoke` diagnostic and unused `pick`/`omit` utils
- `@vyui/core`: type `Radio.vue`'s click handler with `@lynx-js/types`' `MouseEvent`, not the DOM global
- `@vyui/core`: fix `parseColor()`/`isValidColor()` — `hsv()` strings always threw despite being documented as a supported alias of `hsb()`
- `@vyui/kit`: export `tray` from `@vyui/kit/theme` (missing, unlike every other component)
- `@vyui/kit`: add exported `SelectEmits`/`ComboboxEmits`/`FeedListEmits` interfaces; `Combobox`'s `update:modelValue` is now typed instead of `any`
