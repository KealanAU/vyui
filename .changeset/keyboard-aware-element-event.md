---
"@vyui/core": patch
"@vyui/kit": patch
---

Make KeyboardAware work under vue-lynx: the root now receives keyboard height from the input's per-element `@keyboard` event (the global `keyboardstatuschanged` event never reaches the vue-lynx background runtime), inputs self-register with a surrounding `KeyboardAwareRoot` without needing a `KeyboardAwareTrigger` wrap, and `VyTray`'s `keyboardAware` now also covers the body (new `'lift' | 'scroll'` modes plus `bodyScroll` ui slot) instead of silently doing nothing without a footer slot.
