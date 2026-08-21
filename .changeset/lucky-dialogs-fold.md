---
"@vyui/core": minor
"@vyui/kit": minor
---

Collapse the modal / non-modal content wrappers and make `modal` mean something.

`DialogContentModal` and `DialogContentNonModal` were code-identical, as were
`PopoverContentModal` and `PopoverContentNonModal` — the split only mirrored
reka-ui's DOM structure, where the difference is scroll-lock and focus
bookkeeping that has no Lynx equivalent. `DialogContentNonModal` and
`PopoverContentNonModal` are removed; `DialogContent` / `PopoverContent` render
the single remaining wrapper unconditionally. `AlertDialog` already shipped this
shape.

Modality now drives the one lever Lynx does have: `exclusiveFocus`. Both content
impls hardcoded `exclusiveFocus: true`, so a non-modal dialog or popover still
confined assistive tech to itself. They now follow the root's `modal` flag.

- `Dialog` is unaffected by default (`modal` defaults to `true`).
- `Popover` — and `VyPopover` in anchor presentation — defaults to `modal: false`,
  so its content no longer takes exclusive accessibility focus unless you pass
  `modal`. Sheet presentation is unchanged (always modal).
