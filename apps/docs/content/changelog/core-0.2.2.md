---
title: "@vyui/core v0.2.2"
description: "Cleanup pass: dead code removal, export gaps, and a color-parsing bug fix."
date: "2026-07-08"
package: core
version: "v0.2.2"
changelogOrder: 2002
---

### Patch Changes

- Cleanup pass: dead code removal, export gaps, and a color-parsing bug fix. ([#133](https://github.com/KealanAU/vyui/pull/133))

  - `@vyui/core`: export `ConfigProvider` from the public API — `useLocale`/`useDirection` depend on its context but had no supported way to provide it
  - `@vyui/core`: remove the disposable `useMtSmoke` diagnostic and unused `pick`/`omit` utils
  - `@vyui/core`: type `Radio.vue`'s click handler with `@lynx-js/types`' `MouseEvent`, not the DOM global
  - `@vyui/core`: fix `parseColor()`/`isValidColor()` — `hsv()` strings always threw despite being documented as a supported alias of `hsb()`
  - `@vyui/kit`: export `tray` from `@vyui/kit/theme` (missing, unlike every other component)
  - `@vyui/kit`: add exported `SelectEmits`/`ComboboxEmits`/`FeedListEmits` interfaces; `Combobox`'s `update:modelValue` is now typed instead of `any`

- Performance pass around tab switching and theme resolution. ([#134](https://github.com/KealanAU/vyui/pull/134))

  - `@vyui/core`: `Tabs` `unmountOnHide: false` now works — a panel mounts on first visit and stays mounted (hidden via `display: none` + `accessibility-elements-hidden`) after; previously the flag was threaded into context but never read, so panels always unmounted
  - `@vyui/core`: new `Tabs` `deferContent` prop — commits the content swap one macrotask after the trigger/indicator update so the tab bar responds instantly while a heavy panel mounts
  - `@vyui/core`: `TabsContent` accepts a per-panel `unmountOnHide` override (kit: `TabsItem.unmountOnHide`) — panels whose subtrees write styles from main-thread worklets (`setStyleProperty` / `animate(fill: 'forwards')`) can keep painting through the kept-alive `display: none` on device and should opt back into unmounting; kept-hidden panels also set `visibility: hidden` as defence
  - `@vyui/kit`: theme `tv` factories are memoized per app config (`defineThemeBuilder`, also inside `useStyledComponent`) instead of rebuilt per component instance — visible on Lynx's interpreter whenever a screenful of components mounts
  - `@vyui/kit`: `Tabs` forwards `deferContent`, resolves slot classes once per variant change instead of per trigger per render, and its triggers regain press feedback (`active:opacity-60` on the trigger itself — element opacity needs no CSS inheritance)
  - `@vyui/kit`: the Tailwind preset safelist now emits the EXACT classes the packaged themes generate for the configured color set (collected by walking the tv configs) instead of every `utility × color × shade × variant` combination — ~90% less generated CSS (857 KB → 84 KB in kit-demo), and the dead `data-[…]`/`ring-*` entries are gone
