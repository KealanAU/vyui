---
"@vyui/core": patch
---

FeedList: real rubber-band pull-to-refresh via gesture arbitration.

Pull-to-refresh is now a custom rubber-band driven by a gesture-arbitrated
`NativeGesture` (`@lynx-js/gesture-runtime`) on a bare `<list>`, replacing the
native `<refresh>` wrapper. This is the only way to own the pull physics and
threshold while out-arbitrating the list's native vertical scroll. Requires the
engine's new-gesture pipeline, which vue-lynx hardcodes off — flipped on via an
extended `patches/vue-lynx@0.4.0.patch` (`enableNewGesture: true`).

New shared primitive `@/shared/gesture/gestureArbitration` wraps the
consume/intercept policy (SDK `< 3.3` consume vs `>= 3.3` intercept) and the
`__SetGestureDetector` install, without taking a dependency on
`@lynx-js/lynx-ui-common`.

BREAKING (FeedList PTR surface):

- `enableRefresh` now renders a translated wrapper + bare `<list>` instead of a
  native `<refresh>`/`<refresh-header>`.
- New props: `refreshThreshold` (default `64`), `enableBounce`. New
  `v-model:loadingMore`.
- New emits: `refreshStateChange(state)`; `refresh` still fires once per pull
  past threshold on release.
- `refreshHeader` slot now receives `{ state, progress }` slot props.
- New exported type `FeedListRefreshState`
  (`'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'`).
- Removed the imperative `startRefresh` / `finishRefresh` expose; the lifecycle
  is driven by `v-model:refreshing` (set `false` to end and spring the header
  closed). Load-more (native `scrolltolower`), virtualization, and the
  `listType`/`spanCount`/`scrollOrientation`/`bounces` props are unchanged.

The gesture binding and rubber-band physics require iOS-simulator verification
(cannot run under vitest) — see `FeedList/REFRESH-PHYSICS.md`.
