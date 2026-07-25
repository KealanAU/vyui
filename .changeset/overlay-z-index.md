---
"@vyui/core": patch
"@vyui/kit": patch
---

Paint overlays above app content on Lynx web: `OverlayBackdrop` defaults to `z-index: 1000` and `ToastViewport` to `1100`, so an `OverlayRoot` mounted as the app root's first child no longer renders modals behind the page.
