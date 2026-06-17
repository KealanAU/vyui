---
"@vyui/core": patch
---

FeedList: honour a `noMoreData` prop so the end-of-list footer no longer shows while more pages remain.

Previously the core `FeedList` rendered the `noMoreDataFooter` slot whenever `loadingMore` was false, so "no more items" appeared immediately even with pages still loadable (the kit `VyFeedList` already forwarded `noMoreData`, but core ignored it). The footer row now only renders while `loadingMore` (load-more spinner) or once `noMoreData` is `true` (end-of-list); otherwise no footer renders.
