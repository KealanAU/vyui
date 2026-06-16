# FeedList pull-to-refresh — physics & the touch-vs-scroll arbitration

> Verdict: **implemented via `:main-thread-bindtouch*` worklets**, gated to the
> top edge — the gesture-runtime arbitration route was abandoned (blocked on a
> missing vue-lynx binding, see "Upstream gap" below). Builds and unit-tests
> green; the touch binding and rubber-band physics are **device-only verifiable**
> (checklist at the end). This note records why the obvious approaches fail and
> how the working one is wired.

## The problem: gesture ownership

A native `<list>` / `<scroll-view>` **runs its own scroll gesture recognizer**.
When the user drags, the scroller can claim the touch stream and the custom
`translateY` rubber-band never wins. Two routes can take ownership back:

1. **Gesture arbitration** (`@lynx-js/gesture-runtime`): register a recognizer
   and `consumeGesture`/`interceptGesture` frame-by-frame. The *correct* general
   answer — but **blocked in vue-lynx**: it has no `:main-thread-gesture` binding
   to attach the callback worklets on the main thread, so the engine fires the
   callbacks against an empty `worklet_info` and nothing runs (see "Upstream gap"
   below).
2. **Plain touch worklets** (`:main-thread-bindtouch*`): vue-lynx fully supports
   these (ScrollView, Swiper, Slider, SwipeAction, Draggable all use them). They
   *see* every touch but **cannot consume the gesture** from a native scroller.

We use route 2 — because at the **top edge specifically**, ownership isn't
needed:

## The arbitration bet (why touch is enough at the top)

At `scrollTop === 0`, pulling **down**, with the inner list's native `bounces`
forced **off**, there is *nothing for the scroller to scroll to* — so it doesn't
claim the gesture, and `touchmove` keeps arriving. The worklet reads the live
scroll offset (`:main-thread-bindscroll` → `scrollTopRef`), and only paints the
rubber-band while `atTop && (pullingDown || offset > 0)`. Any other state
(scrolled down, flicking up) is left entirely to the native scroller, so normal
scrolling and load-more are untouched.

- **iOS**: at the top with `bounces=false` the scroller is idle; touch wins. No
  extra work.
- **Android**: the edge/overscroll effect can still fire native scroll mid-pull,
  so while we own the pull we toggle `enable-scroll=false` on the list (mirrors
  `ScrollView`'s `_mtEnableScroll`), restoring it on touch-end.

This is a **bet**, not a guarantee — see the device checklist. If a target
platform delivers `touchcancel` the instant the finger moves (handing the
gesture to the scroller before we can gate), the fallback is the native
`<refresh>` wrapper, or contributing the `:main-thread-gesture` binding upstream.

## How vyui wires it

All in `FeedList.vue` (worklets must be inlined in the SFC — vue-lynx's loader
skips MT functions imported from a workspace `.ts`, which then crash the card at
load):

- `:main-thread-bindscroll="_onScrollMT"` + `:main-thread-bindscrolltoupper`
  track the edge. `atTopRef` is driven by the `scrolltoupper` event, not the raw
  `scrollTop`: with item-snap the final settle frame can report a small non-zero
  offset, so the raw value goes stale and the pull would never re-engage after a
  scroll. `:main-thread-bindlayoutchange` + the scroll event's `scrollHeight`
  give the viewport/content heights for bottom-edge (`enableBounce`) detection.
- `:main-thread-bindtouchstart/move/end/cancel` — `_onTouchStart` records the
  `pageY` origin; `_onTouchMove` decides ownership (top: refresh or bounce;
  bottom: bounce only), re-bases the origin on take-over (no jump), paints
  `_rubber(delta)` (signed, so the bottom bounces up) via `setStyleProperty` on
  the `:main-thread-ref` wrapper, and hops pull progress to BG on a downward
  pull; `_onTouchEnd` animates to threshold + fires `refresh`, else springs back.
- `:bounces="false"` on the list — the load-bearing half of the bet.

Only PURE maths is mirrored from `physics.ts` (`rubberEffect`), kept in sync by
hand (a unit test pins it). BG→MT config is pushed via `runOnMainThread` setter
worklets (BG writes to `.current` are dropped in vue-lynx 0.4.0).

## Public API (matches the demo-facing contract)

- `enableRefresh?: boolean` (default `false`)
- `refreshing?: boolean` — `v-model:refreshing`; emits `update:refreshing`
- `refreshThreshold?: number` — px to trigger (default `64`)
- `enableBounce?: boolean` — overscroll bounce at both edges
- emit `refresh` — once when the pull crosses threshold and is released
- emit `refreshStateChange(state: FeedListRefreshState)`
- slot `refreshHeader` with `{ state: FeedListRefreshState, progress: number }`
  (`progress` is 0..1 of threshold)
- `type FeedListRefreshState = 'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'`
- Retained: load-more (native `scrolltolower`), `v-model:loadingMore`,
  `loadMoreFooter` / `noMoreDataFooter` slots, virtualization,
  `listType` / `spanCount` / `scrollOrientation` / `bounces`.

Lifecycle: consumer sets `refreshing = false` to end → header springs closed →
state goes `'done'` then `'idle'`.

## Device-verification checklist (CANNOT run under vitest — no device)

Build + unit tests cover the state machine, prop/emit/slot wiring, and the
rubber-band maths. They do **not** cover the gesture/MT engine. Verify on iOS
(and Android):

1. **`<list>` delivers `bindtouch*` worklets** at all (proven for `<scroll-view>`;
   assumed equivalent for `<list>`). If `_onTouchMove` never paints, it doesn't.
2. **The top-edge bet holds.** Pulling down at the top shows the rubber-band and
   `touchmove` keeps firing (the scroller doesn't steal it with `bounces=false`).
3. **No regression off the top.** Normal scrolling and load-more still work when
   not at the top; the pull never hijacks a mid-list drag.
4. **`scrollTop` shape.** `event.detail.scrollTop` (iOS) / `event.params.scrollTop`
   (Android) populate as assumed.
5. **Android `enable-scroll` toggle** stops native scroll mid-pull and restores
   it cleanly on release (no stuck-disabled list).
6. **Threshold + release.** Cross `refreshThreshold` → `refresh` fires once,
   header holds; release below → springs back to idle.
7. **End-of-refresh spring.** Setting `refreshing = false` springs the header
   closed and lands on `idle` (via `done`).
8. **`enableBounce`** overscroll at both edges (most lightly exercised path).

## Upstream gap (the proper fix, if the bet fails)

The clean answer is a `:main-thread-gesture` binding in vue-lynx. In React-Lynx
`main-thread:gesture={g}` is a compiler+runtime feature wired through the element
snapshot: the BG side calls `processGestureBackground` → `registerWorkletCtx` per
callback, and the MT side calls `processGesture` → `onWorkletCtxUpdate` +
`__SetAttribute(has-react-gesture/flatten)` + `__SetGestureDetector`. Both halves
run against the same element + worklet ctx, so the native side has a runnable
`worklet_info`. vue-lynx ships none of it: calling `__SetGestureDetector` from a
runtime worklet registers the *detector* but never attaches the callback worklets
on MT (`registerWorkletCtx` alone only covers BG function resolution) — hence the
device error `TriggerFiberElementWorklet failed since worklet_info is empty`
(LynxExplorer SDK 1.4.0, iOS, 2026-06-15).

Everything else is present: vue-lynx's `patchProp` already handles
`main-thread-ref` (`SET_MT_REF`) and `main-thread-bind<event>`
(`registerWorkletCtx` + `SET_WORKLET_EVENT` → `__AddEvent`). The PR is to add a
`gesture` case mirroring that: BG `registerWorkletCtx` on each `value.callbacks[*]`
+ `pushOp(SET_GESTURE_DETECTOR, …)`; MT a `SET_GESTURE_DETECTOR` op running the
`processGesture` equivalent. Then FeedList consumes
`:main-thread-gesture="useGesture(NativeGesture).onUpdate(cb)…"` (as lynx-ui
does) and drops the touch workaround. This also unlocks the cases the top-edge
trick can't cover (mid-scroll arbitration, mid-scroller custom bounce).
