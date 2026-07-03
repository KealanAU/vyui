# @vyui/core

## 0.1.0

### Minor Changes

- 0610d70: Input/Textarea: surface the on-screen keyboard via a normalized `keyboard` event.

  - `Input` and `Textarea` (core) and `VyInput`/`VyTextarea` (kit) now emit `keyboard` with `{ visible: boolean, height: number, safeAreaBottom: number }`, normalized from Lynx's raw element payload `{ show, keyBoardHeight, safeAreaBottom }` (note the capital B in `keyBoardHeight`).
  - This is the reliable keyboard signal under vue-lynx: the global `GlobalEventEmitter` `keyboardstatuschanged` event is emitted natively but is not delivered to the vue-lynx background runtime, so the per-element event is what consumers (and keyboard-aware lifts) should use. See `docs/upstream/vue-lynx-keyboard.md`.
  - `VyTextarea` also now forwards `confirm`/`focus`/`blur` (previously only `update:modelValue`), matching `VyInput`.

### Patch Changes

- Fix unresolvable published types: shipped `.d.ts` imported the internal `@/*` path alias (unresolvable for consumers, which also degraded `@vyui/kit`'s re-exported types). Declaration emit now rewrites `@/*` to relative paths and adds explicit `.js` extensions, so types resolve under both `bundler` and `node16`/`nodenext`. Declared `@lynx-js/types` (optional peer) and `vue-component-type-helpers` (dependency), both used by public types. Added a packed-tarball smoke test and a `.d.ts` resolution check to the build.
- 0610d70: FeedList: honour a `noMoreData` prop so the end-of-list footer no longer shows while more pages remain.

  Previously the core `FeedList` rendered the `noMoreDataFooter` slot whenever `loadingMore` was false, so "no more items" appeared immediately even with pages still loadable (the kit `VyFeedList` already forwarded `noMoreData`, but core ignored it). The footer row now only renders while `loadingMore` (load-more spinner) or once `noMoreData` is `true` (end-of-list); otherwise no footer renders.

- baf0692: Fix drawer/sheet not opening fully: Lynx native drops the `dvh` unit, collapsing the panel to its content height. Size the sheet panel with `vh` and switch all viewport-height classes in the kit themes (drawer, modal, select, combobox, popover, dropdownMenu, island, actionSheet) from `dvh` to `vh`.
- 0610d70: Fix Sortable drag-to-reorder doing nothing on device/web:

  - **Registry was empty on the main thread.** Items registered their handle via a background-thread write to the `itemHandlesMT` `MainThreadRef`, which vue-lynx 0.4.0 silently drops. The lifted row never moved, siblings never shifted, and the drop saw `count === 0` so no reorder committed. Registration (element + index) now runs on the main thread, bound to `main-thread-binduiappear`, with MT teardown on unmount and `runOnMainThread` setter worklets for index/disabled sync.
  - **Long-press used MT `setTimeout`.** The main-thread worklet runtime does not expose `setTimeout`/`clearTimeout` (internal in `@lynx-js/types`), so the long-press timer threw and the row never lifted for any `longPressMs > 0`. The hold is now timed by polling `requestAnimationFrame` on the main thread.

  Public props/emits/slots unchanged.

- 300e34f: Keep sheet snap and drag geometry synchronized with dynamic viewport changes, and make kit swipers fill their measured container when no explicit item width is provided.

## 0.0.6

### Patch Changes

- FeedList: load-more on scroll-to-lower; pull-to-refresh removed. ([#74](https://github.com/KealanAU/vyui/pull/74))

  - Debounced / suppressed `loadMore`: it does not fire while a fetch is in flight (`v-model:loadingMore`), when `noMoreData` is set, or within `loadMoreDebounceMs`. Adds `loadMoreFooter` / `noMoreDataFooter` end-of-list slots.
  - Pull-to-refresh is intentionally not implemented. The reference upstream (lynx-ui) never uses the native `<refresh>` / `<refresh-header>` elements — they are legacy built-in UI classes the OSS Lynx runtime does not register (mounting one hard-crashes the create-UI pass). The PTR API (`enableRefresh`, `refreshing`, `refresh`, `refreshHeader` slot, `FeedListRefreshState`, `refreshSupported`) and the `isNativeRefreshSupported()` util are removed. PTR is deferred pending a gesture-runtime-based engine — see `FeedList/REFRESH-PHYSICS.md`.

- FeedList: pull-to-refresh, overscroll bounce, item-snap paging, and load-more. ([#76](https://github.com/KealanAU/vyui/pull/76))

  Pull-to-refresh is a custom rubber-band driven by `:main-thread-bindtouch*`
  worklets on a bare `<list>` (no native `<refresh>` wrapper). The pull only
  engages at the top edge — tracked via `:main-thread-bindscroll` /
  `scrolltoupper`, with the inner list's native `bounces` forced off — so normal
  scrolling and load-more are untouched. This replaces an earlier
  `@lynx-js/gesture-runtime` approach that couldn't fire (vue-lynx has no
  `:main-thread-gesture` binding); the touch path is supported today. The
  top-edge trick is device-only verifiable — see `FeedList/REFRESH-PHYSICS.md`.

  New:

  - `enableRefresh` + `v-model:refreshing`, `refreshThreshold` (default `64`),
    `refresh` / `refreshStateChange` emits, and a `refreshHeader` slot receiving
    `{ state, progress }`. Lifecycle is driven by `v-model:refreshing` (set
    `false` to end and spring the header closed). Exported type
    `FeedListRefreshState` (`'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'`).
  - `enableBounce` — rubber-band overscroll at both edges that springs back;
    works standalone or alongside refresh.
  - `itemSnap` — native `<list>` `item-snap` paging (`true` snaps each item to the
    top for full-screen paging, or pass a custom `{ factor, offset }`), plus a
    `snap` emit (`event.detail.position` = settled index).
  - Load-more on native `scrolltolower` (suppressed while `v-model:loadingMore` is
    set) with `loadMoreFooter` / `noMoreDataFooter` slots.

  Removed the legacy native `<refresh>` / `<refresh-header>` path (unregistered in
  the OSS Lynx runtime — mounting one crashes the create-UI pass) and the old
  `startRefresh` / `finishRefresh` / `refreshSupported` surface.

- Sortable, Draggable, SwipeAction: tighten main-thread gesture fidelity. ([#76](https://github.com/KealanAU/vyui/pull/76))

  Adds velocity-aware release (fling/momentum on drag end rather than
  position-only thresholds), axis locking so a committed gesture ignores the
  orthogonal axis, autoscroll when dragging near a Sortable list edge, and
  bounds clamping. Shared velocity/physics helpers were added to
  `shared/gesture/physics.ts`. Swiper (which shares the gesture layer) is
  unaffected.

- Fix two on-device gesture regressions: ([#76](https://github.com/KealanAU/vyui/pull/76))

  - **Sortable** long-press never started on touch: activation was timed via a MT→BG→`setTimeout`→MT round-trip whose final `runOnMainThread` hop was being dropped on-device, so drag-to-reorder never engaged. The long-press is now timed entirely on the main thread (worklet `setTimeout`), disarmed by a pre-activation move and cleared on release/unmount. Public props/emits/slots unchanged.
  - **SwipeAction** slow-drag appeared frozen after the first open/close: the `fill: 'forwards'` snap animation was never cancelled, so it outranked the next drag's inline `setStyleProperty('transform')` writes in the cascade. Touchstart now cancels the in-flight snap animation and re-asserts the current transform (mirrors Draggable's `resetAnimRef` guard).

- ScrollView: fix custom-bounce content being unscrollable / bounce items not ([#76](https://github.com/KealanAU/vyui/pull/76))
  appearing. When `enableBounces` is on, the component renders a clipping
  wrapper as its root, so consumer `style`/`class` (e.g. `height`) fall through
  to the wrapper — the inner `<scroll-view>` had no size and collapsed, so
  content couldn't scroll and the overscroll wrappers never revealed. The inner
  `<scroll-view>` now fills the wrapper (`width:100%; height:100%`). The
  non-bounce path is unchanged.

- ScrollView: add a main-thread custom bounce/overscroll system. ([#76](https://github.com/KealanAU/vyui/pull/76))

  New props mirroring lynx-ui's bounce surface: `enableBounces`,
  `singleSidedBounce` (`'upper' | 'lower' | 'both' | 'iOSBounces' | 'none'`),
  `alwaysBouncing`, `startBounceTriggerDistance` / `endBounceTriggerDistance`,
  `estimatedHeight` / `estimatedWidth`, and `enableRTL`. Adds `upperBounceItem` /
  `lowerBounceItem` slots for user-supplied overscroll indicators and an
  `onScrollToBounces` (`{ direction: 'upper' | 'lower' }`) event, with bounce
  gesture and animation driven on the main thread via the new `useBounce`
  composable. Preserves the `android-touch-slop` and BTS name-flush workarounds
  so events aren't dropped.

- SwipeAction: velocity-aware release. ([#74](https://github.com/KealanAU/vyui/pull/74))

  A quick flick now opens/commits even on a short drag, while a slow drag respects
  the position threshold. The in-flight snap animation is cancelled on touchstart
  so a follow-up drag isn't masked by a `fill: 'forwards'` animation. Public
  props/emits/slots are unchanged.

- Swiper: add autoplay, loop/circular, axis-lock, and offset clamping. ([#74](https://github.com/KealanAU/vyui/pull/74))

  New `SwiperRoot` props: `loop` (and its lynx-ui-style alias `circular`),
  `axisLock` (only consume predominantly-horizontal gestures, releasing vertical
  drags to the host scroll surface), `autoplay`, and `interval` (autoplay step
  time in ms). Looping wraps navigation, drag-release, and autoplay circularly
  (0 ↔ last) and disables end clamping; autoplay runs on the main thread and
  pauses during a drag, resuming on release.

- Swiper: seamless infinite loop + lynx-ui prop parity. ([#74](https://github.com/KealanAU/vyui/pull/74))

  `loop`/`circular` is now truly seamless — edge slides are cloned (a leading and
  trailing copy of the track) and the transform is rebased invisibly after a seam
  crossing, so motion continues across the first↔last boundary under both
  drag-release and autoplay instead of snap-rewinding. Programmatic `setIndex`
  jumps take the shortest path around the ring.

  New `SwiperRoot` props mirroring lynx-ui: `spaceBetween` (gap between items; the
  snap unit becomes `itemWidth + spaceBetween`), `mode`, `align`
  (`start`/`center`/`end` active-item placement, needs `containerWidth`),
  `containerWidth`, `offsetLimit` (explicit `[startLimit, endLimit]` rest clamp),
  and `rtl` (right-to-left layout flips drag/flick direction and the item margin).
  First-screen track layout (width + seam inset) is applied up front, matching
  lynx-ui's `useFirstScreenStyle` optimization.

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

## 0.0.5

### Patch Changes

- Add AspectRatio — headless `@vyui/core` primitive (`AspectRatioRoot`, exported as both `AspectRatio` and `AspectRatioRoot`) that constrains its default slot to a given `ratio` (number, default `1`). ([#46](https://github.com/KealanAU/vyui/pull/46))

  Built for the Lynx render layer: it renders a single `<view>` using the native CSS `aspect-ratio` property (supported by Lynx's Starlight layout engine), with no absolutely-positioned padding wrapper.

- Add Avatar — headless `@vyui/core` primitives (`AvatarRoot` / `AvatarImage` / `AvatarFallback`) ported from reka-ui. `AvatarRoot` provides image load-status context; `AvatarImage` renders a Lynx `<image>` and downgrades to the error state on `binderror` (`@error`); `AvatarFallback` shows when no image is loaded, with reka's `delayMs` flash-avoidance delay. ([#46](https://github.com/KealanAU/vyui/pull/46))

  Refactor `@vyui/kit`'s `VyAvatar` to compose the new core primitives for behaviour (load-status + fallback) while keeping its public `AvatarProps` API, initials derivation, chip overlay, theming, and `AvatarGroup` size/color inheritance unchanged.

- Fixes from #67, #68 and #70. ([#71](https://github.com/KealanAU/vyui/pull/71))

  `@vyui/core`:

  - Icon: reject `color` values that could inject SVG markup when resolving icon sources (#67).
  - Sheet: multi-snap drag now settles to the nearest snap point, with main-thread usage fixes across `SheetContentImpl`, `Draggable` and `useDragGesture` (#68).
  - Primitive: treat `image` as a self-closing leaf — Vue's empty-slot fragment/comment anchors were materialized as real children by vue-lynx, and a native `<image>` with any child fails to render (native-only breakage; lynx-web tolerated it) (#70).

  `@vyui/kit`:

  - Forward icon classes/props through ActionSheet, Alert, Button, Tabs, Toast, ToggleGroup and DropdownMenu items, and fix Drawer/theme slot classes so drawer animations work again (#70).

## 0.0.4

### Patch Changes

- Add NumberField — headless `@vyui/core` primitive (`NumberFieldRoot` / `NumberFieldInput` / `NumberFieldIncrement` / `NumberFieldDecrement`) with min/max/step, clamp/snap and decimal-precision handling, plus a styled `VyNumberField` in `@vyui/kit`. ([#44](https://github.com/KealanAU/vyui/pull/44))

  Fix `Input` not reflecting programmatic value changes on native Lynx — controlled updates that don't originate from typing are now pushed through the imperative `setValue` path (the reactive `value` binding is initial-only on a native `<input>`). This makes NumberField's increment/decrement buttons update the field on iOS/Android, not just web.

  Avatar now falls back to initials/icon when its image fails to load (wires the Lynx `<image>` `binderror` event).

  Document `VyCombobox` as the autocomplete pattern — `searchable` filtering over a fixed set covers the use case, so there is no separate Autocomplete component.

  Widen `@vyui/kit`'s `@vyui/core` peer-dependency range from `^` to `~` so it tracks `0.0.x` core patches without forcing a major bump.
