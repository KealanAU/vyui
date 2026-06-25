---
"@vyui/core": patch
"@vyui/kit": patch
---

Fix drawer/sheet not opening fully: Lynx native drops the `dvh` unit, collapsing the panel to its content height. Size the sheet panel with `vh` and switch all viewport-height classes in the kit themes (drawer, modal, select, combobox, popover, dropdownMenu, island, actionSheet) from `dvh` to `vh`.
