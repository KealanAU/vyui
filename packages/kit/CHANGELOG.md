# @vyui/kit

## 0.3.2

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

- Fix tailwind preset failing to load from source under jiti (`Cannot find module './theme/index.js'`) — import the theme barrel with an explicit `.ts` extension; Vite still emits `./theme/index.js` in dist. ([#135](https://github.com/KealanAU/vyui/pull/135))

- Updated dependencies [[`0e34d18`](https://github.com/KealanAU/vyui/commit/0e34d181e02d66502ddc06e5b61a61b75e654578), [`ce424a7`](https://github.com/KealanAU/vyui/commit/ce424a71774e0d6b6eda0920ede2caf34fdc036b)]:
  - @vyui/core@0.2.2

## 0.3.1

### Patch Changes

- 62d9f13: Dark mode via semantic design tokens.

  - New role-based token layer (the nuxt/ui + shadcn convention, Lynx-adapted): text (`text-highlighted` / `text-default` / `text-toned` / `text-muted` / `text-dimmed` / `text-inverted`), background (`bg-default` / `bg-muted` / `bg-elevated` / `bg-accented` / `bg-inverted`) and border (`border-default` / `border-muted` / `border-accented` / `border-inverted`). Each is a single-hop `var(--ui-*)` → concrete `theme()` literal, so it resolves on Lynx and flips between modes on its own.
  - Every theme migrated off raw `text-neutral-*` / `bg-neutral-*` / `border-neutral-*` onto these tokens, so a component flips in dark with zero `dark:` variants. Consumers get the same for their own chrome — write `text-muted`, not `text-neutral-500 dark:text-neutral-400`.
  - A single `.dark` class on an app-root ancestor (`useColorMode()`) redefines the tokens to their dark values; the neutral RAMP stays fixed (raw `neutral-*` is a literal shade in both modes — least surprise), and only the accent mode tier shifts `-500` → `-400`.
  - `useColorMode()` composable (`'light' | 'dark' | 'system'`, plus `isDark` / `setMode` / `toggle`) folds `'system'` to the OS appearance and follows it live on web. App-root contract: bind `:class="{ dark: colorMode.isDark }"` + `:key="colorMode.mode"` — the `:key` remount re-skins an already-mounted tree on Lynx native.
  - Mode-tier tokens hold `theme()` literals (not `var(--ui-color-*)` refs), fixing a latent two-level `var()` collapse on device. `rounded` / `shadcn` style overlays (which redeclare `:root`) gain the full token set for light AND dark.

- 3c08b29: `VyInput` now paints its colored border plus a shadow-ring while focused (tracked in JS — Lynx has no `:focus-within`), instead of only via the static `highlight` prop. The ring is a flat arbitrary `box-shadow` (`0 0 0 2px var(--ui-color-{color}-200)`) because the Lynx preset has no `ring*`/`boxShadowColor` plugins; the per-color classes are safelisted in the Tailwind preset. `highlight` still forces the same treatment on permanently.
- 4ee6a7d: Make KeyboardAware work under vue-lynx: the root now receives keyboard height from the input's per-element `@keyboard` event (the global `keyboardstatuschanged` event never reaches the vue-lynx background runtime), inputs self-register with a surrounding `KeyboardAwareRoot` without needing a `KeyboardAwareTrigger` wrap, and `VyTray`'s `keyboardAware` now also covers the body (new `'lift' | 'scroll'` modes plus `bodyScroll` ui slot) instead of silently doing nothing without a footer slot.
- d4f9b1a: Update public package and documentation copy to describe Vy UI as Lynx-native UI primitives for Vue.
- 1637c40: Sortable rows no longer drag list chrome along with the finger. The kit theme now renders each row as a transparent shell (the element core transforms) around a new `itemContent` pill slot, so only the pill visibly moves — the old `border-b` divider look is gone. `SortableItem` flips a `ui-dragging` class (+ `data-state="dragging"`) on the lifted row, and `VYUI_UI_STATES` gains `dragging` so themes can restyle the lifted pill (default: stronger pill border via `group-ui-dragging:`).
- 93c9827: Add `VyApp`, the app-root shell: owns the `dark` class + `:key` remount from `useColorMode`, mounts `OverlayRoot` (opt-out via `:overlays="false"`), sets `--ui-radius` via the `radius` prop, and emits `viewport-change` with the root layout size.

  Also export `resolveColorHex` (from the barrel and the `./provide` entry) so consumers can bake semantic colors into `VyIcon`'s `color` prop — Lynx rasterizes `<svg>`, so `text-*` classes never color an icon.

  Fix icon-only (`square`) buttons rendering off-center: vue-lynx realizes empty slot/`v-if` anchors as real zero-size nodes, so the base `gap-*` added phantom width after the icon. `square` now applies `justify-center gap-0`.

- Updated dependencies [4ee6a7d]
- Updated dependencies [d4f9b1a]
- Updated dependencies [1637c40]
  - @vyui/core@0.2.1

## 0.3.0

### Minor Changes

- c344b72: Per-component subpath entries for tree-shakeable consumption. `@vyui/kit` now exposes every component as its own entry point (`@vyui/kit/button`, `@vyui/kit/tray`, …) with the same canonical `Vy*` bindings as the barrel, so migrating is a specifier swap. Because the vue-lynx main-thread worklet pipeline prunes by `sideEffects` globs over whatever is _reached_ (bare side-effect imports erase export usage), deep entries are the only way to ship less: importing `@vyui/kit/button` now reaches ~37 modules / 26 worklet registrations instead of the barrel's ~294 / 118.

  To make this work end-to-end, kit's build rewrites its own `@vyui/core` barrel imports to per-file deep specifiers (`@vyui/core/dist/components/….vue.js`), and `@vyui/core` exposes a `./dist/*.js` wildcard export to resolve them. Barrel imports (`import { VyButton } from '@vyui/kit'`) keep working unchanged — they just keep the everything-ships behavior.

  Also fixes `@vyui/kit`'s `sideEffects: false`, which let bundlers drop the package entirely from the vue-lynx main-thread worklet slice (entered via a bare side-effect import that uses no exports), so every transitively-imported `@vyui/core` worklet went unregistered and consumers crashed with `bind of undefined`. Kit now declares the same `sideEffects` globs as core.

- c344b72: Ship per-file, source-shaped ESM dist (Vite lib + Rollup `preserveModules`) instead of an rslib bundle.

  - Fixes the `__WEBPACK_EXTERNAL_MODULE_vue_lynx_* is not defined` main-thread crash for npm consumers of worklet-driven components (VyTray, VyDrawer, Slider, …): worklet modules now keep direct named `vue-lynx` imports the consumer's MT toolchain can follow.
  - Fixes the follow-on `cannot read property 'bind' of undefined` main-thread crash: each pre-compiled worklet module retains a `"main thread"` marker so the consumer's `worklet-loader-mt` extracts its `registerWorkletInternal` calls (with `_wkltId`s matching the background bundle) instead of dropping them. `@vyui/kit`'s `sideEffects` is widened to keep the transitive-core-worklet MT imports from being tree-shaken.
  - SFC `<style>` CSS is now published and auto-imported per module — the old bundle stubbed it, so consumers silently lost component styles.
  - Each SFC ships as a single `X.vue.js`; a `check-dist-shape` guard fails the build on any bundle fingerprint or a worklet module missing its marker.

### Patch Changes

- a2696c9: Add an experimental `VyCalendar` component with ISO-string date selection and a built-in Lynx date-runtime caveat.
- a2696c9: **Breaking:** components are now exported under a single canonical `Vy*` name only. The bare aliases (`Button`, `Card`, `Icon`, `AspectRatio`, …) have been removed so there is one name per component — the same one the `VyUI` plugin registers globally. Update imports from `import { Button } from '@vyui/kit'` to `import { VyButton } from '@vyui/kit'`. The unprefixed `Icon`/`AspectRatio` primitives remain available from `@vyui/core`.
- Updated dependencies [c344b72]
- Updated dependencies [c344b72]
  - @vyui/core@0.2.0

## 0.2.0

### Minor Changes

- 5109043: Add `defineVyuiConfig` (new `@vyui/kit/config` entry) so a project's theme is authored once and fed to both the Tailwind preset (build) and `provideVyUI`/`app.use(VyUI)` (runtime), removing the hand-synced `colors` duplication between the two planes.

  - `createVyuiPreset` now accepts a `defineVyuiConfig` result (`{ ui: { colors } }`) alongside the flat `{ colors, neutral, shades }` form
  - `createVyuiPreset` dev-warns when a semantic color can't be backed by a `--ui-color-*` var (no more silent "class resolves to nothing")
  - `@vyui/kit/config` is a light, jiti-safe entry — importing it in `tailwind.config.ts` never pulls component code into the build path

## 0.1.2

### Patch Changes

- cbbbcbf: Ensure tray, drawer, and action sheet content renders above the sheet backdrop by default, and disable automatic capitalization and correction for kit email and password inputs.
- Updated dependencies [cbbbcbf]
  - @vyui/core@0.1.2

## 0.1.1

### Patch Changes

- bb4d208: Add `VyTray` — a morphing, multi-view bottom sheet built on the core `Sheet` primitives. Views (`VyTrayView`) are measured per screen and the panel animates its height to fit whichever is showing ("grows into place"), with a back stack (`useTray().goBack` / `canGoBack`), a persistent `#footer` slot, and `floating` (detached card) vs `flush` (edge-anchored) variants.

  `@vyui/core` `SheetContent` gains a `fitContent` prop that sizes the panel to its natural content height instead of a `snapPoints × viewport` fraction — the drag/slide/backdrop physics reuse the measured height, so nothing else changes. This is the mode `VyTray` builds on.

- 31c2202: Add side-aware sheet and drawer motion. `SheetRoot` now accepts `side` for top, right, bottom, and left edge placement with matching slide animations and drag-to-dismiss physics. `VyDrawer` forwards its side to the core sheet, and sheet-backed kit components can opt into alternate edges.

  Edge placement and the enter/leave slide keyframes key off a `vyui-sheet__content--{side}` class rather than a `[data-side]` attribute selector, so they apply on Lynx native (which does not match attribute selectors in CSS) — restoring the open/close animation on device.

- Updated dependencies [bb4d208]
- Updated dependencies [31c2202]
  - @vyui/core@0.1.1

## 0.1.0

### Minor Changes

- 0610d70: Input/Textarea: surface the on-screen keyboard via a normalized `keyboard` event.

  - `Input` and `Textarea` (core) and `VyInput`/`VyTextarea` (kit) now emit `keyboard` with `{ visible: boolean, height: number, safeAreaBottom: number }`, normalized from Lynx's raw element payload `{ show, keyBoardHeight, safeAreaBottom }` (note the capital B in `keyBoardHeight`).
  - This is the reliable keyboard signal under vue-lynx: the global `GlobalEventEmitter` `keyboardstatuschanged` event is emitted natively but is not delivered to the vue-lynx background runtime, so the per-element event is what consumers (and keyboard-aware lifts) should use. See `docs/upstream/vue-lynx-keyboard.md`.
  - `VyTextarea` also now forwards `confirm`/`focus`/`blur` (previously only `update:modelValue`), matching `VyInput`.

### Patch Changes

- First working published build. Every prior release (0.0.1–0.0.4) shipped components as self-importing wrappers, so `import { Button } from '@vyui/kit'` resolved to `undefined`; the package now bundles from explicit entries and is guarded by a packed-tarball smoke test + a `.d.ts` resolution check. Also: `provideVyUI` (theme config without eager component registration) and a `components` option for selective global registration; corrected install docs (Tailwind preset wiring, `style.css` via Tailwind, overlay/toast hosts, `vue-lynx` entry); `exports` `types` before `import`; `prepublishOnly` guard.
- 300e34f: Add small horizontal (landscape) mode support — the work that gets the kit-demo running on mobile in landscape. Compact, viewport-safe layouts for overlays, sheets, menus, tabs, steppers, islands, cards, alerts, and toasts. Select and Combobox sheet structure is now fully themeable for responsive overrides.
- 0610d70: Input: forward `@focus` and `@blur` events.

  - The core `Input` emits `focus`/`blur` (with the current value), but the `VyInput` wrapper only re-emitted `update:modelValue` and `confirm`, so consumers couldn't react to focus changes (e.g. to drive a keyboard-aware lift). It now forwards both.

- 0610d70: IslandButton: bake the icon color so the theme's foreground actually applies.

  - `IslandButton` rendered its glyph through Lynx's `<svg>`, which rasterizes the XML and can't inherit `currentColor` — so the `text-slate-*` utility on the `leadingIcon` slot (and the darker `text-slate-900` active shade) never reached the icon, leaving it stuck on its default fill (invisible on dark/active pills).
  - It now resolves the foreground utility off the merged `leadingIcon` class — honoring the active state and any consumer `ui.leadingIcon` override — and passes it to `<VyIcon :color>`, matching the pattern already used by `Button`, `Input`, `Alert`, and `Combobox`. Non-palette colors (e.g. arbitrary `text-[#abc]`) fall back to the icon's `currentColor` default.

- 491db6a: Default input chrome to neutral: form controls no longer paint a primary border or icon by default.

  - Resting border on `Input`, `Textarea`, `Select`, `Combobox`, `NumberField` and `PinInput` is now neutral (`border-neutral-200`) regardless of `color` — matching the no-focus-state reality on Lynx. The colored border stays available as opt-in via the `highlight` prop.
  - Leading/trailing icons (and `NumberField` steppers) now default to neutral (dimmed) instead of the `color` palette; override per-icon with your own `:color` via the `leading` / `trailing` slots.
  - `RadioGroup`: space the control from its label with `gap-2` on the item instead of `ms-2` on the wrapper — Lynx ignores logical inline margins, which collapsed the dot and text together.

- baf0692: Fix drawer/sheet not opening fully: Lynx native drops the `dvh` unit, collapsing the panel to its content height. Size the sheet panel with `vh` and switch all viewport-height classes in the kit themes (drawer, modal, select, combobox, popover, dropdownMenu, island, actionSheet) from `dvh` to `vh`.
- 300e34f: Keep sheet snap and drag geometry synchronized with dynamic viewport changes, and make kit swipers fill their measured container when no explicit item width is provided.
- 14e0722: Add `@vyui/cli`, a shadcn-style CLI that copies `@vyui/kit` components (and their dependencies) into a project from a style-namespaced registry, rewriting imports to the consumer's aliases.

  - `init` / `add` / `styles` commands; tsconfig/jsconfig alias + package-manager detection.
  - Shadcn-style project preflight and automatic, idempotent app-entry/Tailwind wiring.
  - `list`, `view`, `info`, interactive `add`, and `--dry-run` discovery/preview workflows.
  - Safe upgrades: explicit components may be overwritten while shared files and transitive dependencies remain user-owned.
  - Registry targets are contained to the project root (rejects `../` / absolute / null-byte paths).
  - Cyclic registry dependency graphs resolve instead of deadlocking.

  kit: drive the switch thumb with flex justification instead of `translate-x-*` (Lynx drops `transform` painting), and reset the native `<textarea>` user-agent border.

- 300e34f: Make vertical tabs reserve a navigation rail and let their content fill the remaining width. Vertical triggers no longer inherit the horizontal `pill` variant's `flex-1` stretch — they keep their natural height and left-align their icon/label so the rail reads as a sidebar list.
- Updated dependencies [0610d70]
- Updated dependencies [0610d70]
- Updated dependencies [baf0692]
- Updated dependencies [0610d70]
- Updated dependencies [300e34f]
  - @vyui/core@0.1.0

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

- Add Avatar — Lynx-native `@vyui/core` primitives (`AvatarRoot` / `AvatarImage` / `AvatarFallback`). `AvatarRoot` provides image load-status context; `AvatarImage` renders a Lynx `<image>` and downgrades to the error state on `binderror` (`@error`); `AvatarFallback` shows when no image is loaded, with a `delayMs` flash-avoidance delay. ([#46](https://github.com/KealanAU/vyui/pull/46))

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
