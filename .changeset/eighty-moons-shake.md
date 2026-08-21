---
"@vyui/core": patch
---

Remove the main-thread half of `useTouchEmulation` (the `onTouch*MT` options and the `main-thread-*` handler keys). It emitted `main-thread:bind*` keys, which vue-lynx's `patchProp` never recognised — only the `main-thread-` prefix is, so the worklets were never attached and the callbacks could not have fired on any platform. Removes exported type members, but nothing could have depended on the behaviour. The background-thread half is unchanged. MT gestures bind `:main-thread-bind*` in the SFC with the worklets inlined there.
