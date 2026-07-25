---
'@vyui/core': patch
---

Fix the slider never moving on Lynx web.

Two independent bails, both before the gesture emitted anything, which is why
the value sat frozen at whatever it mounted with while native felt fine.

The one that actually stranded it: `_dragStart` aborted when it could not
resolve the thumb elements to paint. That lookup goes through the main-thread
`querySelectorAll` wrapper, which calls a `__QuerySelectorAll` PAPI that Lynx
web does not expose to the main-thread realm — `invoke` resolves there, this
throws `ReferenceError`, and a `typeof` check on the wrapper method cannot see
it coming. The query is now guarded, and no longer gates the drag: those
elements only drive the main-thread paint, which is a latency optimisation over
the background's own render, so losing them costs smoothness rather than
correctness. The background still receives every value and renders the thumb
from its own style.

The second: the track's extent was the last piece of geometry sourced from a
background `@layoutchange` pushed across with `runOnMainThread`. `_beginAt`
already fetches `invoke('boundingClientRect')` once per gesture for the origin,
and that response carries `width`/`height` too, so the extent comes from it as
well. One measurement, one frame, no thread hop — and re-read per gesture,
which also fixes a track that resized while its tab was hidden.

`draggingMT` is wired up while here: `SliderImplMTS` was setting a local ref of
its own, so the root's gate against echoing a live `update:modelValue` back
into the main thread's values was never armed.
