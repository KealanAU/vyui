---
"@vyui/core": patch
"@vyui/kit": patch
---

Better access to the native-host seams:

- `@vyui/core`: new `useGlobalEvent(name, listener, { immediate })` — subscribe to `GlobalEventEmitter` events with lifecycle cleanup (now backing keyboard, exposure, and lazy-component internals) — and `getViewportSize()` — the LynxView size in logical px from `SystemInfo` (now backing Sheet/ScrollView viewport estimates).
- `@vyui/kit`: `useColorMode()` in `'system'` mode now reads the host's `theme: "light" | "dark"` global prop at boot and follows live `themechanged` global events, so native apps can drive dark mode from the device appearance.
- `@vyui/core`: `Textarea` no longer applies a `maxLength` of `140` by default. The prop is now unset, leaving the platform's own limit in place — unlimited on iOS and Android, `140` on Harmony. Pass an explicit value to enforce a limit or to get identical behavior on every platform.
