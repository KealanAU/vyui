---
'@vyui/core': patch
---

Fix the sheet replaying its exit animation after a drag-dismiss.

Releasing a drag past the dismiss threshold drove the close twice: the MT
release transition slid the panel off from where the finger left it, and
Presence's `.ui-leaving` keyframe then ran the same close again — starting from
the fully-open underlying value, so the panel snapped back up and played the
exit a second time. The scrim did the same through `vyui-fade-out`, which keeps
an explicit `from { opacity: 1 }`.

The inline `animation: 'none'` the release worklet paints was meant to suppress
that keyframe, but a class-driven animation outranks it on the Lynx style path.
`SheetRoot` now carries a `dragClosing` flag, set by the release worklet before
it emits the close, that drops `ui-leaving` from the panel and backdrop for that
path — the MT transition owns the close and `@transitionend` still advances
Presence to `Left`. Non-drag closes keep the keyframe unchanged.
