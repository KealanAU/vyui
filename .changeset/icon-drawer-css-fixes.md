---
"@vyui/core": patch
"@vyui/kit": patch
---

Fix icon styling pass-through and Drawer rendering (#70).

`@vyui/core`: treat `image` as a self-closing leaf in `Primitive` — Vue's empty-slot fragment/comment anchors were materialized as real children by vue-lynx, and a native `<image>` with any child fails to render (native-only breakage; lynx-web tolerated it).

`@vyui/kit`: forward icon classes/props through ActionSheet, Alert, Button, Tabs, Toast, ToggleGroup and DropdownMenu items, and fix Drawer/theme slot classes so drawer animations work again.
