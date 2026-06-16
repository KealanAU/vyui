---
title: Gesture & scroll motion overhaul
description: Custom pull-to-refresh and overscroll bounce, a seamless Swiper loop, sharper drag physics, and Sonner-ready Toast internals.
date: 2026-06-16
package: core
version: v0.0.6
---

A motion-focused release: the scroll and gesture primitives gain the physics they were missing on native Lynx.

**FeedList** gets a full pull-to-refresh + paging surface. Pull-to-refresh is a custom rubber-band driven by `:main-thread-bindtouch*` worklets on a bare `<list>` — it only engages at the top edge, so normal scrolling and load-more are untouched. New: `enableRefresh` + `v-model:refreshing`, `refreshThreshold`, `refresh` / `refreshStateChange` emits and a `refreshHeader` slot (`{ state, progress }`); `enableBounce` rubber-band overscroll at both edges; `itemSnap` native `item-snap` paging with a `snap` emit; and debounced load-more on `scrolltolower` with `loadMoreFooter` / `noMoreDataFooter` slots. The legacy native `<refresh>` path (unregistered in the OSS Lynx runtime) is removed.

**ScrollView** adds a main-thread custom bounce/overscroll system mirroring lynx-ui: `enableBounces`, `singleSidedBounce`, `alwaysBouncing`, trigger-distance and estimated-size props, `enableRTL`, `upperBounceItem` / `lowerBounceItem` slots, and an `onScrollToBounces` event — driven by the new `useBounce` composable.

**Swiper** loop is now truly seamless — edge slides are cloned and the transform rebases invisibly across the first↔last seam under both drag-release and autoplay. Adds `loop`/`circular`, `axisLock`, `autoplay` + `interval`, plus lynx-ui prop parity: `spaceBetween`, `mode`, `align` + `containerWidth`, `offsetLimit`, and `rtl`.

**Sortable, Draggable & SwipeAction** tighten on-device gesture fidelity: velocity-aware release (fling/momentum), axis locking, autoscroll near Sortable list edges, and bounds clamping, via shared helpers in `shared/gesture/physics.ts`. Fixes two regressions — Sortable long-press now arms entirely on the main thread (the BG round-trip was being dropped on-device), and SwipeAction cancels its in-flight `fill: 'forwards'` snap on touchstart so a follow-up slow drag isn't masked.

**Toast** internals are prepped for stacking: `ToastRoot` binds its own `@layoutchange` to feed fan-out geometry, exposes `duration` and `progress` slot values, and ships a new `ToastSwipe` main-thread swipe-to-dismiss layer (exporting the unit-tested `decideDismiss` policy).
