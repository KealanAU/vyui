---
title: "@vyui/core v0.1.0"
description: "0610d70: Input/Textarea: surface the on-screen keyboard via a normalized keyboard event."
date: "2026-06-25"
package: core
version: "v0.1.0"
changelogOrder: 1000
---

### Minor Changes

- 0610d70: Input/Textarea: surface the on-screen keyboard via a normalized `keyboard` event.

  - `Input` and `Textarea` (core) and `VyInput`/`VyTextarea` (kit) now emit `keyboard` with `{ visible: boolean, height: number, safeAreaBottom: number }`, normalized from Lynx's raw element payload `{ show, keyBoardHeight, safeAreaBottom }` (note the capital B in `keyBoardHeight`).
  - This is the reliable keyboard signal under vue-lynx: the global `GlobalEventEmitter` `keyboardstatuschanged` event is emitted natively but is not delivered to the vue-lynx background runtime, so the per-element event is what consumers (and keyboard-aware lifts) should use. See `docs/upstream/vue-lynx-keyboard.md`.
  - `VyTextarea` also now forwards `confirm`/`focus`/`blur` (previously only `update:modelValue`), matching `VyInput`.

### Patch Changes

- 0610d70: FeedList: honour a `noMoreData` prop so the end-of-list footer no longer shows while more pages remain.

  Previously the core `FeedList` rendered the `noMoreDataFooter` slot whenever `loadingMore` was false, so "no more items" appeared immediately even with pages still loadable (the kit `VyFeedList` already forwarded `noMoreData`, but core ignored it). The footer row now only renders while `loadingMore` (load-more spinner) or once `noMoreData` is `true` (end-of-list); otherwise no footer renders.

- baf0692: Fix drawer/sheet not opening fully: Lynx native drops the `dvh` unit, collapsing the panel to its content height. Size the sheet panel with `vh` and switch all viewport-height classes in the kit themes (drawer, modal, select, combobox, popover, dropdownMenu, island, actionSheet) from `dvh` to `vh`.
- 0610d70: Fix Sortable drag-to-reorder doing nothing on device/web:

  - **Registry was empty on the main thread.** Items registered their handle via a background-thread write to the `itemHandlesMT` `MainThreadRef`, which vue-lynx 0.4.0 silently drops. The lifted row never moved, siblings never shifted, and the drop saw `count === 0` so no reorder committed. Registration (element + index) now runs on the main thread, bound to `main-thread-binduiappear`, with MT teardown on unmount and `runOnMainThread` setter worklets for index/disabled sync.
  - **Long-press used MT `setTimeout`.** The main-thread worklet runtime does not expose `setTimeout`/`clearTimeout` (internal in `@lynx-js/types`), so the long-press timer threw and the row never lifted for any `longPressMs > 0`. The hold is now timed by polling `requestAnimationFrame` on the main thread.

  Public props/emits/slots unchanged.

- 300e34f: Keep sheet snap and drag geometry synchronized with dynamic viewport changes, and make kit swipers fill their measured container when no explicit item width is provided.
