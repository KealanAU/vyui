# vue-lynx is missing the `main-thread:gesture` binding (gesture-runtime)

**Status: blocked on upstream (vue-lynx).** FeedList's custom rubber-band
pull-to-refresh (and ScrollView custom bounce, Sortable/Draggable pan-stealing)
needs `@lynx-js/gesture-runtime` gesture arbitration. The native engine fires
the gesture callbacks, but the callback worklets are never attached to the
element on the main thread, so the runtime logs:

```
Fire Fiber Element Worklet UnknownEvent: onBegin
TouchEventHandler::TriggerFiberElementWorklet failed since worklet_info is empty is null.
```

(Confirmed on LynxExplorer SDK 1.4.0, iOS, 2026-06-15.)

## Root cause

In **React-Lynx** the `main-thread:gesture={g}` JSX prop is a **compiler +
runtime** feature wired through the element snapshot:

- **Background side** — `runtime/lib/backgroundSnapshot.js` detects a
  gesture-typed prop value and calls `processGestureBackground(value)`
  (`runtime/lib/gesture/processGestureBagkround.js`), which for each callback
  calls `onPostWorkletCtx(cb)` → `registerWorkletCtx(cb)`. This registers the
  callback worklet ctx (assigns `_execId`, links its JS-function handles).
- **Main-thread side** — the compiler emits `updateGesture(snapshot, expIndex,
  oldValue, elementIndex, 'main-thread')` (`runtime/lib/snapshot/gesture.js`,
  called from `snapshot/spread.js`), which calls `processGesture(element, value,
  oldValue, isHydrating)` (`runtime/lib/gesture/processGesture.js`):
  `onWorkletCtxUpdate(cb, …)` per callback **then**
  `__SetAttribute(dom,'has-react-gesture',true)` / `__SetAttribute(dom,'flatten',
  false)` / `__SetGestureDetector(dom, id, type, config, relationMap)`.

The two halves run against the **same element + same worklet ctx** through the
snapshot lifecycle, so the worklet is registered in **both** realms and the
native side has a runnable `worklet_info`.

**vue-lynx has no equivalent.** Calling `__SetGestureDetector` manually at
runtime (from an MT worklet) registers the *detector* but never attaches the
callback worklets to the element on the main thread — `registerWorkletCtx`
alone (e.g. via the `runOnMainThread(fn)` side effect) only covers background
function resolution, not the main-thread `worklet_info`.

## What's actually missing (everything else is present)

vue-lynx already has the analogous worklet-event binding. In
`vue-lynx/runtime/dist/node-ops.js` `patchProp`, `main-thread-*` props are
handled:

- `main-thread-ref` → `OP.SET_MT_REF`.
- `main-thread-bind<event>` → `registerWorkletCtx(nextValue)` **+**
  `OP.SET_WORKLET_EVENT` → (MT) `applySetWorkletEvent` → `__AddEvent(el,'worklet',
  name, { type:'worklet', value: ctx })`.

A `main-thread-gesture` case is simply not there. The new-gesture pipeline
itself works (we flip `enableNewGesture: true` via
`patches/vue-lynx@0.4.0.patch`), and the engine dispatches the gesture — only
the binding/attachment is absent.

## Upstream change (the PR)

Add a `:main-thread-gesture` binding, mirroring the worklet-event path:

1. **BG — `runtime/dist/node-ops.js` `patchProp`**, in the `main-thread-`
   branch add `if (suffix === 'gesture')`: run the `processGestureBackground`
   equivalent (`registerWorkletCtx` on each `value.callbacks[*]`, recursing
   composed gestures) and `pushOp(OP.SET_GESTURE_DETECTOR, el.id,
   serializedGesture)`.
2. **MT — `main-thread/dist/ops-apply.js`**, add a `SET_GESTURE_DETECTOR`
   case: resolve the element from the registry and run the `processGesture`
   equivalent (`__SetAttribute` has-react-gesture/flatten +
   `__SetGestureDetector(el, id, type, config, relationMap)`).
3. Add `OP.SET_GESTURE_DETECTOR` to `internal/ops` and type
   `:main-thread-gesture` (a serialized `BaseGesture` from
   `@lynx-js/gesture-runtime`).

Then vyui consumes it the way lynx-ui does
(`lynx-ui/packages/lynx-ui-feed-list/src/index.tsx:374`):

```html
<list :main-thread-gesture="useGesture(NativeGesture).onUpdate(cb)…" />
```

…and FeedList drops the manual `__SetGestureDetector` install entirely.

## Until then

FeedList keeps the full PTR engine (physics, state machine, inline MT worklets)
behind `enableRefresh`, but it cannot fire — see `FeedList.vue` and
`REFRESH-PHYSICS.md`. The tiktok-demo ships with PTR disabled (snap paging +
comments load-more remain). Track: this file.
