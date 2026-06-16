---
"@vyui/core": patch
---

FeedList: pull-to-refresh, overscroll bounce, item-snap paging, and load-more.

Pull-to-refresh is a custom rubber-band driven by `:main-thread-bindtouch*`
worklets on a bare `<list>` (no native `<refresh>` wrapper). The pull only
engages at the top edge — tracked via `:main-thread-bindscroll` /
`scrolltoupper`, with the inner list's native `bounces` forced off — so normal
scrolling and load-more are untouched. This replaces an earlier
`@lynx-js/gesture-runtime` approach that couldn't fire (vue-lynx has no
`:main-thread-gesture` binding); the touch path is supported today. The
top-edge trick is device-only verifiable — see `FeedList/REFRESH-PHYSICS.md`.

New:

- `enableRefresh` + `v-model:refreshing`, `refreshThreshold` (default `64`),
  `refresh` / `refreshStateChange` emits, and a `refreshHeader` slot receiving
  `{ state, progress }`. Lifecycle is driven by `v-model:refreshing` (set
  `false` to end and spring the header closed). Exported type
  `FeedListRefreshState` (`'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'`).
- `enableBounce` — rubber-band overscroll at both edges that springs back;
  works standalone or alongside refresh.
- `itemSnap` — native `<list>` `item-snap` paging (`true` snaps each item to the
  top for full-screen paging, or pass a custom `{ factor, offset }`), plus a
  `snap` emit (`event.detail.position` = settled index).
- Load-more on native `scrolltolower` (suppressed while `v-model:loadingMore` is
  set) with `loadMoreFooter` / `noMoreDataFooter` slots.

Removed the legacy native `<refresh>` / `<refresh-header>` path (unregistered in
the OSS Lynx runtime — mounting one crashes the create-UI pass) and the old
`startRefresh` / `finishRefresh` / `refreshSupported` surface.
