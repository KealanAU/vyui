---
"@vyui/core": minor
"@vyui/kit": minor
---

Input/Textarea: surface the on-screen keyboard via a normalized `keyboard` event.

- `Input` and `Textarea` (core) and `VyInput`/`VyTextarea` (kit) now emit `keyboard` with `{ visible: boolean, height: number, safeAreaBottom: number }`, normalized from Lynx's raw element payload `{ show, keyBoardHeight, safeAreaBottom }` (note the capital B in `keyBoardHeight`).
- This is the reliable keyboard signal under vue-lynx: the global `GlobalEventEmitter` `keyboardstatuschanged` event is emitted natively but is not delivered to the vue-lynx background runtime, so the per-element event is what consumers (and keyboard-aware lifts) should use. See `docs/upstream/vue-lynx-keyboard.md`.
- `VyTextarea` also now forwards `confirm`/`focus`/`blur` (previously only `update:modelValue`), matching `VyInput`.
