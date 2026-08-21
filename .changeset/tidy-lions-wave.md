---
"@vyui/core": patch
---

Remove `getDragPoint`, `isMouseReleased`, and the `DragPoint` type. Nothing referenced them: the desktop mouse-drag work replaced the background-thread coordinate helpers with per-component main-thread coord cores, and the module's own header still named Slider as its consumer and documented the superseded `:global-bindmousemove` pattern. Removes exported members from `@vyui/core`.
