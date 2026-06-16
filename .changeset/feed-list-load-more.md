---
"@vyui/core": patch
---

FeedList: load-more on scroll-to-lower; pull-to-refresh removed.

- Debounced / suppressed `loadMore`: it does not fire while a fetch is in flight (`v-model:loadingMore`), when `noMoreData` is set, or within `loadMoreDebounceMs`. Adds `loadMoreFooter` / `noMoreDataFooter` end-of-list slots.
- Pull-to-refresh is intentionally not implemented. The reference upstream (lynx-ui) never uses the native `<refresh>` / `<refresh-header>` elements — they are legacy built-in UI classes the OSS Lynx runtime does not register (mounting one hard-crashes the create-UI pass). The PTR API (`enableRefresh`, `refreshing`, `refresh`, `refreshHeader` slot, `FeedListRefreshState`, `refreshSupported`) and the `isNativeRefreshSupported()` util are removed. PTR is deferred pending a gesture-runtime-based engine — see `FeedList/REFRESH-PHYSICS.md`.
