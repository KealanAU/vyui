---
"@vyui/kit": patch
---

Input: forward `@focus` and `@blur` events.

- The core `Input` emits `focus`/`blur` (with the current value), but the `VyInput` wrapper only re-emitted `update:modelValue` and `confirm`, so consumers couldn't react to focus changes (e.g. to drive a keyboard-aware lift). It now forwards both.
