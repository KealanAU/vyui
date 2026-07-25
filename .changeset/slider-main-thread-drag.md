---
'@vyui/core': patch
'@vyui/kit': patch
---

Make Slider's main-thread drag the only drag implementation, and fix it so it
works. It previously filled its thumb registry and every `*MT` mirror with
background-thread writes to `MainThreadRef.current`, which vue-lynx silently
no-ops — the main thread saw an empty handle list and bailed out of
`_paintActiveThumb` on every frame, while the commit read a stale array and
landed as `next[0] ?? 0`.

- `SliderRoot`'s min/max/step/disabled/values mirrors hop through
  `runOnMainThread` setter worklets, the shape `Sheet` uses.
- `SliderImplMTS` resolves the thumb and range elements itself from the track via
  `querySelectorAll`, removing the BG→MT registration and its mount-time race.
  `SliderThumbImpl` no longer touches a `MainThreadRef` at all.
- `update:modelValue` now fires per frame during the drag, so a value rendered
  next to the slider tracks the gesture instead of jumping on release.
  `valueCommit` stays once per gesture, compared against the value the gesture
  started from.
- The thumb and the filled range are painted from the worklets by writing the
  same anchor offsets the background style computes, so neither thread's write
  can double-count the other's.
- Values are re-sorted and the active thumb re-tracked every frame, and
  `minStepsBetweenThumbs` is enforced per frame rather than at commit time — a
  thumb stops at the limit instead of springing back on release.
- Touch offsets are read from `touches[0].x`/`.y`, which are already relative to
  the bound element. Rebuilding them from `pageY - layoutchange.top` mixed
  viewport and page coordinates and drifted by the scroll offset.
- Fixes the thumb sitting half its own width off-centre on right-anchored
  (inverted / RTL) sliders: the centring transform flips with the anchoring edge
  on the vertical axis but did not on the horizontal one.
- Fixes the `md` thumb rendering 0×0 — `size-4.5` is not a Tailwind v3 utility,
  so it compiled to no CSS at all.

**Removed:** the background drag implementation (`SliderImpl`), the
`mainThreadDrag` prop, and keyboard stepping. The keyboard handlers never fired
on Lynx native, which has no key events to bind.
