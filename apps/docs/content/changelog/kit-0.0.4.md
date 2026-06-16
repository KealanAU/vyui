---
title: Stacked toasts & FeedList gestures
description: Sonner-style stacked, swipeable toasts with a countdown bar, and a FeedList wrapper that forwards the new pull-to-refresh, bounce and snap surface.
date: 2026-06-16
package: kit
version: v0.0.4
---

`@vyui/kit@0.0.4` brings the new core gesture surface to the styled components.

**Toast** gains Sonner-style behaviour, all off by default:

- `stacked` — collapses toasts into an overlapping pile (front toast fully visible, the rest peeking scaled-down behind it) and fans them out when expanded; tap to toggle. Pair `stackFrom` (`top` | `bottom`) with the `ToastViewport` position.
- `swipe` (+ `swipeDirection`) — fling a toast sideways to dismiss. The card rides an inner `ToastSwipe` layer so the swipe transform never collides with the stacking transform.
- `progress` — a thin countdown bar that drains with the auto-dismiss timer (pauses while expanded, hidden when `duration: 0`).

A plain `VyToast` still renders as a single gapped-column card.

**FeedList** wrapper now forwards the full pull-to-refresh surface to core — `enableRefresh`, `v-model:refreshing`, `refreshThreshold`, `enableBounce`, the `refresh` / `refreshStateChange` emits, and the `refreshHeader` slot (`{ state, progress }`) — plus the new `itemSnap` prop and `snap` emit. The `loadMoreFooter` slot is aligned with core's new no-arg signature (the footer renders only while loading).
