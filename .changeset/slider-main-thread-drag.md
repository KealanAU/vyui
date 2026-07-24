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
- The filled range is painted from the drag worklets alongside the thumb.
  Background only hears the value on `touchend`, so the fill previously sat
  frozen for the whole gesture and snapped on release.
- The track is measured on the background from `@layoutchange` and pushed across,
  replacing a `getBoundingClientRect()` call that Lynx's main-thread `Element`
  does not implement.

**Removed:** the background drag implementation (`SliderImpl`), the
`mainThreadDrag` prop, and keyboard stepping. The keyboard handlers never fired
on Lynx native, which has no key events to bind.
