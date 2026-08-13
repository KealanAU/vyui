---
"@vyui/kit": patch
---

Fix the docs/playground build failing on `VyToggle`: vue-loader can't resolve `ToggleProps`'s base type across the package boundary, so the `extends` is marked `/* @vue-ignore */`. The inherited props are fallthrough attrs at runtime either way.
