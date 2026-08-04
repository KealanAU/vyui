---
"@vyui/core": patch
"@vyui/kit": patch
---

Better access to the native-host seams:

- `@vyui/core`: new `useGlobalEvent(name, listener, { immediate })` — subscribe to `GlobalEventEmitter` events with lifecycle cleanup (now backing keyboard, exposure, and lazy-component internals) — and `getViewportSize()` — the LynxView size in logical px from `SystemInfo` (now backing Sheet/ScrollView viewport estimates).
- `@vyui/kit`: `useColorMode()` in `'system'` mode now reads the host's `theme: "light" | "dark"` global prop at boot and follows live `themechanged` global events, so native apps can drive dark mode from the device appearance.
