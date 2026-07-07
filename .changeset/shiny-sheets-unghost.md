---
"@vyui/core": patch
---

Fix the sheet ghost-panel-eats-taps bug: usePresence now hard-caps total time in Leaving (un-cancellable MAX_LEAVING_FRAMES net that forces Left even when an animation start never resolves) — so a vue-lynx replace-all style patch that kills a close animation without firing its end/cancel can no longer leave an invisible tap-eating panel mounted.
