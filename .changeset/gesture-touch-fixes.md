---
"@vyui/core": patch
---

Fix two on-device gesture regressions:

- **Sortable** long-press never started on touch: activation was timed via a MT→BG→`setTimeout`→MT round-trip whose final `runOnMainThread` hop was being dropped on-device, so drag-to-reorder never engaged. The long-press is now timed entirely on the main thread (worklet `setTimeout`), disarmed by a pre-activation move and cleared on release/unmount. Public props/emits/slots unchanged.
- **SwipeAction** slow-drag appeared frozen after the first open/close: the `fill: 'forwards'` snap animation was never cancelled, so it outranked the next drag's inline `setStyleProperty('transform')` writes in the cascade. Touchstart now cancels the in-flight snap animation and re-asserts the current transform (mirrors Draggable's `resetAnimRef` guard).
