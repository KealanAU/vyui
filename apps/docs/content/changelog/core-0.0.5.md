---
title: @vyui/core v0.0.5
description: Add AspectRatio — headless @vyui/core primitive (AspectRatioRoot, exported as both AspectRatio and AspectRatioRoot) that constrains its default slot to a giv…
date: 2026-06-11
package: core
version: v0.0.5
---

### Patch Changes

- Add AspectRatio — headless `@vyui/core` primitive (`AspectRatioRoot`, exported as both `AspectRatio` and `AspectRatioRoot`) that constrains its default slot to a given `ratio` (number, default `1`). ([#46](https://github.com/KealanAU/vyui/pull/46))

  Built for the Lynx render layer: it renders a single `<view>` using the native CSS `aspect-ratio` property (supported by Lynx's Starlight layout engine), with no absolutely-positioned padding wrapper.

- Add Avatar — Lynx-native `@vyui/core` primitives (`AvatarRoot` / `AvatarImage` / `AvatarFallback`). `AvatarRoot` provides image load-status context; `AvatarImage` renders a Lynx `<image>` and downgrades to the error state on `binderror` (`@error`); `AvatarFallback` shows when no image is loaded, with a `delayMs` flash-avoidance delay. ([#46](https://github.com/KealanAU/vyui/pull/46))

  Refactor `@vyui/kit`'s `VyAvatar` to compose the new core primitives for behaviour (load-status + fallback) while keeping its public `AvatarProps` API, initials derivation, chip overlay, theming, and `AvatarGroup` size/color inheritance unchanged.

- Fixes from #67, #68 and #70. ([#71](https://github.com/KealanAU/vyui/pull/71))

  `@vyui/core`:

  - Icon: reject `color` values that could inject SVG markup when resolving icon sources (#67).
  - Sheet: multi-snap drag now settles to the nearest snap point, with main-thread usage fixes across `SheetContentImpl`, `Draggable` and `useDragGesture` (#68).
  - Primitive: treat `image` as a self-closing leaf — Vue's empty-slot fragment/comment anchors were materialized as real children by vue-lynx, and a native `<image>` with any child fails to render (native-only breakage; lynx-web tolerated it) (#70).

  `@vyui/kit`:

  - Forward icon classes/props through ActionSheet, Alert, Button, Tabs, Toast, ToggleGroup and DropdownMenu items, and fix Drawer/theme slot classes so drawer animations work again (#70).
