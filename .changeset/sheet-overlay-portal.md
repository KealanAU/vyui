---
"@vyui/core": patch
---

Sheet now paints through the app-root `<OverlayRoot>` so it escapes ancestor `overflow: hidden` on Lynx native (#12).

`SheetContent` and `SheetBackdrop` wrap their impls in a new `<OverlayPortal>` (exported from `@vyui/core`), matching how Dialog, DropdownMenu, Combobox and Toast already portal. Presence is unchanged — the portal mounts inside it, so enter/leave animations still run to completion before unmount.

Consumers must have an `<OverlayRoot />` at the app root; `<VyApp>` mounts one by default.
