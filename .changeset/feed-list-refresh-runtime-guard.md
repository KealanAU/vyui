---
"@vyui/core": patch
---

FeedList: stop the create-UI crash on runtimes without the native `<refresh>` element.

The native `<refresh>` / `<refresh-header>` UI classes are legacy elements that stock LynxExplorer / the OSS engine do not register; mounting `<refresh>` there hard-crashes the create-UI pass (`LynxCreateUIException: refresh ui not found when create UI`).

- Render the `<refresh>` wrapper only when the runtime supports it; otherwise mount the bare virtualized `<list>` with pull-to-refresh gracefully disabled. `enable-refresh` now mounts cleanly everywhere.
- Add `isNativeRefreshSupported()` (conservative, crash-safe: `false` unless the host advertises `SystemInfo.supportRefreshUI`) and a new FeedList `refreshSupported` prop override (`undefined` auto-detect, `true` force-on, `false` force-off).
- Expose `refreshSupported` via `defineExpose`; emit a `__DEV__` warning when `enable-refresh` is set but the element is unavailable.
- Public API, the `FeedListRefreshState` machine, load-more debounce, and the `<refresh-header>`-as-sibling layout are unchanged.
