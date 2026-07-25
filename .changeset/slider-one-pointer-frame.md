---
'@vyui/core': patch
---

Map Slider's touch and mouse gestures through one pointer coordinate frame.

The touch path read `touches[0].x`/`.y`, which Lynx reports element-relative on
native but does not provide on web at all — `createCrossThreadEvent` builds web
touches from raw DOM `Touch` objects, which carry no `x`/`y`, so every offset
came through as `NaN` and the thumb never moved on a touchscreen browser.

Both paths now read `clientX`/`clientY`, the only pointer field Lynx reports on
native and web alike, and share a single `_beginAt` that captures the track's
origin from `invoke('boundingClientRect')` once per gesture and subtracts it.
The origin still never comes from `layoutchange`, which reports page-relative
coordinates that drift from the pointer's viewport frame by the scroll offset.
