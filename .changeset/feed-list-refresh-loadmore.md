---
"@vyui/core": patch
---

FeedList: refine pull-to-refresh and load-more.

- Add a refresh lifecycle state machine (idle / pulling / releaseReady / refreshing / done) layered over the native `<refresh>` element, exposed to the `refreshHeader` slot and via a new `refreshStateChange` emit and `refreshState` export.
- Guard against the native element double-firing `startrefresh`, and reset cleanly when `refreshing` flips back to false (settle through `done` then rebound the header, configurable via `refreshDoneDuration`).
- Debounce / suppress `loadMore`: it no longer fires while a fetch is in flight (`v-model:loadingMore`), when `noMoreData` is set, or within `loadMoreDebounceMs`.
- Add `loadMoreFooter` / `noMoreDataFooter` slots for end-of-list affordances.
