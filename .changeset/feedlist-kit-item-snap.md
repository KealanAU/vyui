---
"@vyui/kit": patch
---

FeedList wrapper: forward the new `itemSnap` prop to core (`true` for
full-screen `item-snap` paging, or a custom `{ factor, offset }`). Also align
the `loadMoreFooter` slot with core's new no-arg signature (core renders the
footer only while loading, so `loading` is always `true` in that slot).
