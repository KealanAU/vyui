---
"@vyui/core": patch
---

Sortable, Draggable, SwipeAction: tighten main-thread gesture fidelity.

Adds velocity-aware release (fling/momentum on drag end rather than
position-only thresholds), axis locking so a committed gesture ignores the
orthogonal axis, autoscroll when dragging near a Sortable list edge, and
bounds clamping. Shared velocity/physics helpers were added to
`shared/gesture/physics.ts`. Swiper (which shares the gesture layer) is
unaffected.
