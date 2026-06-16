# @vyui/kit

## 0.0.4

### Patch Changes

- FeedList wrapper: forward the full pull-to-refresh surface to core ([#76](https://github.com/KealanAU/vyui/pull/76))
  (`enableRefresh`, `v-model:refreshing`, `refreshThreshold`, `enableBounce`, the
  `refresh` / `refreshStateChange` emits, and the `refreshHeader` slot with
  `{ state, progress }`). Also forward the new `itemSnap` prop (`true` for
  full-screen `item-snap` paging, or a custom `{ factor, offset }`) and the new
  `snap` emit (native `bindsnap`; `event.detail.position` = settled index), and
  align the `loadMoreFooter` slot with core's new no-arg signature (core renders
  the footer only while loading, so `loading` is always `true` in that slot).

- Add Sonner-style stacking to Toast. ([#73](https://github.com/KealanAU/vyui/pull/73))

  `@vyui/core`:

  - `ToastRoot` now binds its own `@layoutchange`, so the measured toast height feeds `heightBefore` automatically (previously nothing fed the resize observer, leaving the fan-out geometry at 0).
  - `ToastRoot` exposes two new slot values: `duration` (resolved auto-dismiss ms) and `progress` (`1 → 0` countdown that rides the dismiss timer's start/pause/restart lifecycle, frozen while expanded).
  - New `ToastSwipe` component — a main-thread swipe-to-dismiss layer (modeled on `SwipeAction`) that dismisses the surrounding `ToastRoot` when flung past a distance/velocity threshold. Exports `decideDismiss` for the unit-tested release policy.

  `@vyui/kit`: `VyToast` gains:

  - `stacked` — collapses toasts into an overlapping pile (front toast fully visible, the rest peeking scaled-down behind it) and fans them out under each other when expanded; tap a toast to toggle. Pair `stackFrom` (`top` | `bottom`, default `bottom`) with the `ToastViewport` position.
  - `swipe` (+ `swipeDirection`) — fling a toast sideways to dismiss it. The card renders on an inner `ToastSwipe` layer so the swipe transform never collides with the stacking transform.
  - `progress` — a thin countdown bar along the bottom edge that drains with the auto-dismiss timer (pauses while expanded, hidden when `duration: 0`).

  All off by default; a plain `VyToast` still renders as a single gapped-column card.

- Updated dependencies [[`fc9b621`](https://github.com/KealanAU/vyui/commit/fc9b621ba9e37e5920fb4b78062e25f65249a0b6), [`30a6732`](https://github.com/KealanAU/vyui/commit/30a6732cd908d2d248318bf6023af549963dd6f6), [`30a6732`](https://github.com/KealanAU/vyui/commit/30a6732cd908d2d248318bf6023af549963dd6f6), [`30a6732`](https://github.com/KealanAU/vyui/commit/30a6732cd908d2d248318bf6023af549963dd6f6), [`30a6732`](https://github.com/KealanAU/vyui/commit/30a6732cd908d2d248318bf6023af549963dd6f6), [`30a6732`](https://github.com/KealanAU/vyui/commit/30a6732cd908d2d248318bf6023af549963dd6f6), [`fc9b621`](https://github.com/KealanAU/vyui/commit/fc9b621ba9e37e5920fb4b78062e25f65249a0b6), [`fc9b621`](https://github.com/KealanAU/vyui/commit/fc9b621ba9e37e5920fb4b78062e25f65249a0b6), [`fc9b621`](https://github.com/KealanAU/vyui/commit/fc9b621ba9e37e5920fb4b78062e25f65249a0b6), [`f9366e3`](https://github.com/KealanAU/vyui/commit/f9366e332c8bd78f3191523c25f51ee6e43aa79c)]:
  - @vyui/core@0.0.6

## 0.0.3

### Patch Changes

- Add Avatar — headless `@vyui/core` primitives (`AvatarRoot` / `AvatarImage` / `AvatarFallback`) ported from reka-ui. `AvatarRoot` provides image load-status context; `AvatarImage` renders a Lynx `<image>` and downgrades to the error state on `binderror` (`@error`); `AvatarFallback` shows when no image is loaded, with reka's `delayMs` flash-avoidance delay. ([#46](https://github.com/KealanAU/vyui/pull/46))

  Refactor `@vyui/kit`'s `VyAvatar` to compose the new core primitives for behaviour (load-status + fallback) while keeping its public `AvatarProps` API, initials derivation, chip overlay, theming, and `AvatarGroup` size/color inheritance unchanged.

- Configurable semantic colors (nuxt/ui-style), defined once and extensible. ([#48](https://github.com/KealanAU/vyui/pull/48))

  - Single source of truth `theme/color-constants.js` (shared by themes + Tailwind preset); `neutral` split out of the configurable `COLORS` list and appended automatically (nuxt/ui parity).
  - Theme files are now builder functions `(colors) => themeObject`; `useStyledComponent` invokes them with the resolved list so `appConfig.ui.colors` configures the set at runtime.
  - `@vyui/kit/tailwind` adds a `createVyuiPreset({ colors })` factory; the default export is unchanged.
  - True type parity via the augmentable `VyuiColorRegistry` interface — `declare module '@vyui/kit' { interface VyuiColorRegistry { tertiary: true } }` makes custom colors autocomplete + typo-check on every component `color` prop, no build plugin needed. `scripts/gen-colors.mjs` generates the registry augmentation + CSS-var block.
  - Fixes a latent `ThemeTV` widening that typed `color` (and other variants) as `PropertyKey` on `useStyledComponent`-based components.

  Breaking: theme default exports changed from objects to builder functions; `COLORS` no longer includes `neutral` (use `ALL_COLORS`).

- Fixes from #67, #68 and #70. ([#71](https://github.com/KealanAU/vyui/pull/71))

  `@vyui/core`:

  - Icon: reject `color` values that could inject SVG markup when resolving icon sources (#67).
  - Sheet: multi-snap drag now settles to the nearest snap point, with main-thread usage fixes across `SheetContentImpl`, `Draggable` and `useDragGesture` (#68).
  - Primitive: treat `image` as a self-closing leaf — Vue's empty-slot fragment/comment anchors were materialized as real children by vue-lynx, and a native `<image>` with any child fails to render (native-only breakage; lynx-web tolerated it) (#70).

  `@vyui/kit`:

  - Forward icon classes/props through ActionSheet, Alert, Button, Tabs, Toast, ToggleGroup and DropdownMenu items, and fix Drawer/theme slot classes so drawer animations work again (#70).

- Fix stranded foreground colors on Lynx (`enableCSSInheritance: false`). Color set on a wrapping `<view>` slot never reached the nested text/icon, so it rendered in the default color — invisible on dark/colored surfaces (e.g. a neutral-solid button or solid card). ([#52](https://github.com/KealanAU/vyui/pull/52))

  Foreground `text-*` now lands on the text-bearing slots (label / title / description / icon / input value) across `input`, `textarea`, `numberField`, `select`, `combobox`, `toggle`, `toggleGroup`, `chip`, `islandButton`, `card`, `accordion`, `dropdownMenu`, `tabs`, `stepper`. State-driven colors on child elements use the `group-data-[state=…]` form, and the Tailwind preset safelist is widened to cover those variants so they aren't purged.

- Updated dependencies [[`1b0d3bc`](https://github.com/KealanAU/vyui/commit/1b0d3bc1f6932e668a1830ea031dc046888c0711), [`1b0d3bc`](https://github.com/KealanAU/vyui/commit/1b0d3bc1f6932e668a1830ea031dc046888c0711), [`9a0241c`](https://github.com/KealanAU/vyui/commit/9a0241cdad8a594e49f9e8965c10fdc70b3bee0c)]:
  - @vyui/core@0.0.5

## 0.0.2

### Patch Changes

- Add NumberField — headless `@vyui/core` primitive (`NumberFieldRoot` / `NumberFieldInput` / `NumberFieldIncrement` / `NumberFieldDecrement`) with min/max/step, clamp/snap and decimal-precision handling, plus a styled `VyNumberField` in `@vyui/kit`. ([#44](https://github.com/KealanAU/vyui/pull/44))

  Fix `Input` not reflecting programmatic value changes on native Lynx — controlled updates that don't originate from typing are now pushed through the imperative `setValue` path (the reactive `value` binding is initial-only on a native `<input>`). This makes NumberField's increment/decrement buttons update the field on iOS/Android, not just web.

  Avatar now falls back to initials/icon when its image fails to load (wires the Lynx `<image>` `binderror` event).

  Document `VyCombobox` as the autocomplete pattern — `searchable` filtering over a fixed set covers the use case, so there is no separate Autocomplete component.

  Widen `@vyui/kit`'s `@vyui/core` peer-dependency range from `^` to `~` so it tracks `0.0.x` core patches without forcing a major bump.

  Improve `Island` defaults and DX. A new `layer` prop (`overlay` / `base` / `inline`) splits stacking from edge placement: `position` now only picks the viewport edge (`top` / `bottom`), while `layer` controls whether the island floats over content, sits on a low layer beneath modals/drawers, or drops into normal flow for a parent to place. Floating placement is applied via an inline `style` so a lone `<VyIsland>` hovers with no wrapper on Lynx (which ignores tailwind `fixed`). `Island` now defaults to `layer: 'overlay'` and `IslandGroup` defaults to `position: 'bottom'`, so both float sensibly out of the box.
