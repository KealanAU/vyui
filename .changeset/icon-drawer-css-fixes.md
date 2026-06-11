---
"@vyui/core": patch
"@vyui/kit": patch
---

Fixes from #67, #68 and #70.

`@vyui/core`:

- Icon: reject `color` values that could inject SVG markup when resolving icon sources (#67).
- Sheet: multi-snap drag now settles to the nearest snap point, with main-thread usage fixes across `SheetContentImpl`, `Draggable` and `useDragGesture` (#68).
- Primitive: treat `image` as a self-closing leaf — Vue's empty-slot fragment/comment anchors were materialized as real children by vue-lynx, and a native `<image>` with any child fails to render (native-only breakage; lynx-web tolerated it) (#70).

`@vyui/kit`:

- Forward icon classes/props through ActionSheet, Alert, Button, Tabs, Toast, ToggleGroup and DropdownMenu items, and fix Drawer/theme slot classes so drawer animations work again (#70).
