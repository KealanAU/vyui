---
"@vyui/core": patch
"@vyui/kit": patch
---

Add Sonner-style stacking to Toast.

`@vyui/core`:
- `ToastRoot` now binds its own `@layoutchange`, so the measured toast height feeds `heightBefore` automatically (previously nothing fed the resize observer, leaving the fan-out geometry at 0).
- `ToastRoot` exposes two new slot values: `duration` (resolved auto-dismiss ms) and `progress` (`1 → 0` countdown that rides the dismiss timer's start/pause/restart lifecycle, frozen while expanded).
- New `ToastSwipe` component — a main-thread swipe-to-dismiss layer (modeled on `SwipeAction`) that dismisses the surrounding `ToastRoot` when flung past a distance/velocity threshold. Exports `decideDismiss` for the unit-tested release policy.

`@vyui/kit`: `VyToast` gains:
- `stacked` — collapses toasts into an overlapping pile (front toast fully visible, the rest peeking scaled-down behind it) and fans them out under each other when expanded; tap a toast to toggle. Pair `stackFrom` (`top` | `bottom`, default `bottom`) with the `ToastViewport` position.
- `swipe` (+ `swipeDirection`) — fling a toast sideways to dismiss it. The card renders on an inner `ToastSwipe` layer so the swipe transform never collides with the stacking transform.
- `progress` — a thin countdown bar along the bottom edge that drains with the auto-dismiss timer (pauses while expanded, hidden when `duration: 0`).

All off by default; a plain `VyToast` still renders as a single gapped-column card.
