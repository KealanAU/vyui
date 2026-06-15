---
"@vyui/core": patch
---

Swiper: seamless infinite loop + lynx-ui prop parity.

`loop`/`circular` is now truly seamless — edge slides are cloned (a leading and
trailing copy of the track) and the transform is rebased invisibly after a seam
crossing, so motion continues across the first↔last boundary under both
drag-release and autoplay instead of snap-rewinding. Programmatic `setIndex`
jumps take the shortest path around the ring.

New `SwiperRoot` props mirroring lynx-ui: `spaceBetween` (gap between items; the
snap unit becomes `itemWidth + spaceBetween`), `mode`, `align`
(`start`/`center`/`end` active-item placement, needs `containerWidth`),
`containerWidth`, `offsetLimit` (explicit `[startLimit, endLimit]` rest clamp),
and `rtl` (right-to-left layout flips drag/flick direction and the item margin).
First-screen track layout (width + seam inset) is applied up front, matching
lynx-ui's `useFirstScreenStyle` optimization.
