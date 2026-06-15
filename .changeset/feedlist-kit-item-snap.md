---
"@vyui/kit": patch
---

FeedList wrapper: forward the full pull-to-refresh surface to core
(`enableRefresh`, `v-model:refreshing`, `refreshThreshold`, `enableBounce`, the
`refresh` / `refreshStateChange` emits, and the `refreshHeader` slot with
`{ state, progress }`). Also forward the new `itemSnap` prop (`true` for
full-screen `item-snap` paging, or a custom `{ factor, offset }`) and the new
`snap` emit (native `bindsnap`; `event.detail.position` = settled index), and
align the `loadMoreFooter` slot with core's new no-arg signature (core renders
the footer only while loading, so `loading` is always `true` in that slot).
