---
'@vyui/core': patch
'@vyui/kit': patch
---

Drive every gesture surface from mouse events on Lynx web, and fix Sortable's
drop.

Lynx web dispatches raw mouse events and never synthesizes touch from them, so
touch-only worklets left every drag surface inert in a desktop browser. Each
gesture core now takes plain coordinates, with thin touch and mouse wrappers
over it: `Draggable`, `Slider`, `Swiper`, `SwipeAction`, `Sheet`, `Toast` swipe,
and `Sortable`. Release is explicit-buttons-only, a 500ms guard swallows the
compatibility mousedown a touch browser replays after a tap, and no
`mouseleave` is bound (it doesn't bubble, so per-element delivery is
unreliable on the Lynx dispatch path).

Sortable fixes on top of that:

- The lifted row gets `zIndex` from its background-side dragging state instead
  of painting in DOM order, so dragging down no longer slides it under the rows
  it passes — where they swallowed the pointer and the gesture's own
  move/up worklets stopped arriving.
- Release settles the row into its target slot and re-runs the sibling shift
  for the final velocity-adjusted target; the transforms are cleared from the
  background once the reorder has rendered. Clearing them on the main thread at
  release repainted the pre-drag order for the frames the commit took to
  round-trip, which read as the list snapping back.
- `longPressMs` defaults to 150 (was 250).
