---
"@vyui/core": patch
---

Fix Sortable drag-to-reorder doing nothing on device/web:

- **Registry was empty on the main thread.** Items registered their handle via a background-thread write to the `itemHandlesMT` `MainThreadRef`, which vue-lynx 0.4.0 silently drops. The lifted row never moved, siblings never shifted, and the drop saw `count === 0` so no reorder committed. Registration (element + index) now runs on the main thread, bound to `main-thread-binduiappear`, with MT teardown on unmount and `runOnMainThread` setter worklets for index/disabled sync.
- **Long-press used MT `setTimeout`.** The main-thread worklet runtime does not expose `setTimeout`/`clearTimeout` (internal in `@lynx-js/types`), so the long-press timer threw and the row never lifted for any `longPressMs > 0`. The hold is now timed by polling `requestAnimationFrame` on the main thread.

Public props/emits/slots unchanged.
