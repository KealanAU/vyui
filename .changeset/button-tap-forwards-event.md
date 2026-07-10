---
"@vyui/core": patch
---

`Button` forwards the Lynx tap event through its `tap` emit (`tap: [event: TouchEvent]`). Previously it emitted bare, so modifier-wrapped listeners merged in via `asChild` — like `ToastClose`'s `@tap.stop` over a button — crashed with `undefined.stopPropagation` on tap, leaving the toast close button broken.
