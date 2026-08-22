---
"@vyui/core": major
"@vyui/kit": patch
---

Delete five unused surfaces and collapse AlertDialog onto Dialog.

Removed (zero consumers in kit, examples, docs, or fixtures):

- `Pagination*` and its `utils` — a web pattern with no mobile use.
- `List` / `ListItem` — its own header pointed at `FeedList`; use Lynx's `<list>` directly.
- `useAnimate` — exported, undocumented, never called.
- `useDateFormatter` and the `@vyui/core/date` subpath (`calendar`, `comparators`, `types`), dropping the `@internationalized/date` dependency. `VyCalendar` already runs on kit's own ISO helpers. `DateFormatter` and `installIntlPolyfill` are unaffected.

`AlertDialog` was a 14-file, 1052-line fork of `Dialog`. `DialogRoot` gains a
`role` prop (`'dialog' | 'alertdialog'`); `alertdialog` announces alert-dialog
semantics AND makes the dialog undismissable by an outside tap, on both the
content backdrop and `DialogOverlay`. Every `AlertDialog*` name stays exported —
`AlertDialogRoot` presets the role, the rest are aliases over the matching
Dialog primitive. `<Dialog role="alertdialog">` is now equivalent.

Behavior changes for existing `AlertDialog` users:

- `AlertDialogAction` and `AlertDialogCancel` are both `DialogClose`. `Action`'s `click` emit still fires; `Cancel` gained one.
- `AlertDialogRoot` gains `modal` (default `true`) and no longer exposes `open` via a template ref.
- `AlertDialogContent` no longer ships built-in fade/zoom keyframes — core is headless, so supply them like you do for `Dialog`.
- `DialogClose` no longer forces `accessibility-label="Close"`; it announces its own child text. Pass the label explicitly on icon-only closers. `VyModal` does this for you.
