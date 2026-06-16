---
"@vyui/core": patch
---

ScrollView: fix custom-bounce content being unscrollable / bounce items not
appearing. When `enableBounces` is on, the component renders a clipping
wrapper as its root, so consumer `style`/`class` (e.g. `height`) fall through
to the wrapper — the inner `<scroll-view>` had no size and collapsed, so
content couldn't scroll and the overscroll wrappers never revealed. The inner
`<scroll-view>` now fills the wrapper (`width:100%; height:100%`). The
non-bounce path is unchanged.
