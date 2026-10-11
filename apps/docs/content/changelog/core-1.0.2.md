---
title: "@vyui/core v1.0.2"
description: "Type main-thread element refs and worklet event handlers with a shared MTElement / MTRef alias and @lynx-js/types event types instead of any and as unknown a…"
date: "2026-10-11"
package: core
version: "v1.0.2"
changelogOrder: 1000002
---

### Patch Changes

- Type main-thread element refs and worklet event handlers with a shared `MTElement` / `MTRef` alias and `@lynx-js/types` event types instead of `any` and `as unknown as` casts. No runtime change. ([#213](https://github.com/KealanAU/vyui/pull/213))

- Remove dead code. Kit drops the unused `useComponentIcons` composable and its `UseComponentIconsProps` type (no kit component called it). Core drops the internal `DateFormatter` host-probing wrapper, which was never exported from the package index — `installIntlPolyfill` is unchanged. ([#214](https://github.com/KealanAU/vyui/pull/214))

- Type the `trueValue`/`falseValue` defaults on `SwitchRoot` and `CheckboxRoot` as `T` instead of casting them to `undefined`, and drop the `as any` casts into `useStandardVModel`. No runtime change. ([#213](https://github.com/KealanAU/vyui/pull/213))
