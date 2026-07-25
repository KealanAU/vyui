---
'@vyui/core': patch
---

Fix `<Presence>` wedging permanently on web when an animation end/cancel event
is lost, and restore parity with upstream `lynx-family/lynx-ui` on the
reopen-during-close path.

- `handleKFStart`/`handleTransitionStart` no longer bump the entering/leaving
  loop ids. Bumping killed the frame watchdog the instant any animation started,
  leaving the machine trusting an end event that web does not reliably deliver —
  a child unmounted mid-transition never fires one, and DOM bubbling feeds child
  animation events into these handlers to begin with. A stuck `Leaving` kept the
  invisible backdrop mounted, swallowing every tap under it.
- Both watchdogs now poll through in-flight animations and force-resolve past a
  `MAX_STUCK_MS` (3s) wall-clock ceiling. Wall-clock rather than frames because
  rAF cadence varies across environments.
- `show` flipping back to `true` during `Leaving` now remounts via `restartShow()`
  instead of tearing down. Previously a reopen racing `Leaving` → `Left` stranded
  `show=true` with nothing mounted and the trigger went permanently dead.
- `onOpen`/`onClose` are deduped through `hasNotifiedOpen`, so a
  reopen-during-close that routes back through `Entered` doesn't double-fire.
- A close that races the enter animation no longer cuts straight to `Leaving`.
  The exit keyframe starts from the element's underlying (fully-open) value, so
  swapping mid-enter snapped the element open and played the exit from there —
  the action sheet flashing up before sliding back out. The dismiss is deferred
  until the enter resolves, which the existing `handleAnimationEnd` safeguard
  and entering watchdog already route to `Leaving`.
