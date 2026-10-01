---
"@vyui/kit": patch
"@vyui/core": patch
---

Remove dead code. Kit drops the unused `useComponentIcons` composable and its `UseComponentIconsProps` type (no kit component called it). Core drops the internal `DateFormatter` host-probing wrapper, which was never exported from the package index — `installIntlPolyfill` is unchanged.
