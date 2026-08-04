---
"@vyui/core": patch
---

`Primitive` now omits `undefined`-valued attributes instead of forwarding them to the renderer, matching Vue's DOM semantics.

vue-lynx's `patchProp` has no nullish guard, so an `undefined` attr was patched like any other: it crossed the op bridge as JSON (`undefined` → `null` in the ops array) and landed as `__SetAttribute(el, key, null)` — a native prop-reset for a prop that was never set. A stock `Textarea` emitted ~11 of these per mount. An explicit `null` still reaches the element, and clearing a prop at runtime is unaffected.

Alongside it, `Textarea` no longer applies a `maxLength` of `140` by default. The prop is now unset, leaving the platform's own limit in place — unlimited on iOS and Android, `140` on Harmony. Pass an explicit value to enforce a limit or to get identical behavior on every platform.
