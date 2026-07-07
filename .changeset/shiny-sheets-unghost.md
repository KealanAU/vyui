---
"@vyui/core": patch
---

Fix the sheet ghost-panel-eats-taps bug: usePresence now hard-caps total time in Leaving (un-cancellable MAX_LEAVING_FRAMES net that forces Left even when an animation start never resolves), and SheetContentImpl gates the `.ui-leaving` slide-out keyframe with a `vyui-sheet__content--mt-close` class applied in the same render — so a vue-lynx replace-all style patch can no longer wipe the worklets' inline `animation: none` and restart the keyframe mid-close.
