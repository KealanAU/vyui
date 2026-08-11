---
"@vyui/kit": patch
---

`VyToggle`'s `ToggleProps` now extends the core primitive's props, so `as`, `asChild`, and `defaultValue` get real TypeScript/IDE support. They already worked at runtime via `$attrs` fall-through; this only closes the typing gap.