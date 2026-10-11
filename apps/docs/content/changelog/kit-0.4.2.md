---
title: "@vyui/kit v0.4.2"
description: "Remove dead code."
date: "2026-10-11"
package: kit
version: "v0.4.2"
changelogOrder: 4002
---

### Patch Changes

- Remove dead code. Kit drops the unused `useComponentIcons` composable and its `UseComponentIconsProps` type (no kit component called it). Core drops the internal `DateFormatter` host-probing wrapper, which was never exported from the package index — `installIntlPolyfill` is unchanged. ([#214](https://github.com/KealanAU/vyui/pull/214))

- Type `AppConfig.ui` by component name: each key (`button`, `card`, `switch`, …) is now a `Partial` of that component's theme instead of `unknown`, so overrides autocomplete and a mis-shaped one is a type error. Custom semantic color keys (`ui.tertiary`) stay accepted. ([#213](https://github.com/KealanAU/vyui/pull/213))
- Updated dependencies [[`13dd45f`](https://github.com/KealanAU/vyui/commit/13dd45fb13f60485671b5980b2b966dc537a93c3), [`36452e3`](https://github.com/KealanAU/vyui/commit/36452e3bfebc170f413cb23d90fafa67fa3d957e), [`13dd45f`](https://github.com/KealanAU/vyui/commit/13dd45fb13f60485671b5980b2b966dc537a93c3)]:
  - @vyui/core@1.0.2
