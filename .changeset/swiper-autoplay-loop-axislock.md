---
"@vyui/core": patch
---

Swiper: add autoplay, loop/circular, axis-lock, and offset clamping.

New `SwiperRoot` props: `loop` (and its lynx-ui-style alias `circular`),
`axisLock` (only consume predominantly-horizontal gestures, releasing vertical
drags to the host scroll surface), `autoplay`, and `interval` (autoplay step
time in ms). Looping wraps navigation, drag-release, and autoplay circularly
(0 ↔ last) and disables end clamping; autoplay runs on the main thread and
pauses during a drag, resuming on release.
