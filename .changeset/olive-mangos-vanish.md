---
"@vyui/core": patch
---

Remove four dead exports and one prop alias:

- `IslandContainer` — a styled pill wrapper with zero consumers, superseded by
  `VyIsland` / `VyIslandGroup` in `@vyui/kit`. It was the only importer of
  `tailwind-merge`, which is now off core's dependency list.
- `useSize` — built on `ResizeObserver` / `offsetWidth`, neither of which exists
  on Lynx, so it never reported a size. Its only caller was `SliderThumbImpl`'s
  `getThumbInBoundsOffset` correction, which was therefore always `0`; the
  helper, the offset, and `SliderRoot`'s now-unread `thumbAlignment` prop (and
  its `ThumbAlignment` type) go with it. Thumb centring is unchanged — the
  `translate(±50%)` on the anchoring edge already does it.
- `<Presence>`'s `present` prop — a v1 alias for `show`. Pass `show` instead;
  the `present` slot prop is unaffected.
