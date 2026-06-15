# FeedList pull-to-refresh — physics & gesture arbitration

> Verdict (was "not feasible"): **implemented via `@lynx-js/gesture-runtime`
> gesture arbitration.** Builds and unit-tests green; the gesture binding and
> rubber-band physics are **device-only verifiable** (see the checklist at the
> end). This note records why the obvious approaches fail and how the working
> one is wired, so the next person doesn't re-derive it.

## The problem: gesture ownership

A native `<list>` / `<scroll-view>` **consumes its own vertical scroll
gesture**. If you hand-roll a rubber-band — listen for touch, paint a
`translateY` via `setStyleProperty` on overscroll — the native scroller keeps
claiming the touch stream the moment the user drags past the top edge, and the
custom transform never wins. Custom pull-to-refresh and overscroll bounce both
hit this wall. You cannot fix it from the BG thread or with plain
`:main-thread-bindtouch*` worklets: those see the touches, but they cannot take
*ownership* away from the native scroller.

The supported fix is **gesture arbitration**: register a gesture recognizer on
the element and, from its main-thread callbacks, tell the engine frame-by-frame
whether *you* own the touch (`consumeGesture` / `interceptGesture`) or the
native scroller does. This is what `@lynx-js/gesture-runtime` + the engine's
"new gesture" pipeline provide.

## Why the easy paths don't work under vue-lynx

### Native `<refresh>` wrapper
Works, but: no control over header physics/threshold, and crashes on some iOS
`<list>` configs (`LynxCreateUIException: refresh-header ui not found` when the
header is a direct `<list>` child). It also can't do custom overscroll bounce.
Acceptable as a fallback, not as the product.

### React's `main-thread:gesture={g}` — **not available in vue-lynx**
In React-Lynx, `main-thread:gesture` is a **compiler** feature. The JSX
transform emits `updateGesture(...)` into the component snapshot, which calls
`processGesture` →
`__SetGestureDetector(dom, id, type, config, relationMap)` plus
`__SetAttribute(dom, 'has-react-gesture', true)` and `flatten=false`, and
registers each callback as a worklet ctx (`onWorkletCtxUpdate`).

**vue-lynx ships none of this.** Its template compiler has no gesture
transform, and its runtime `patchProp`
(`vue-lynx/runtime/dist/node-ops.js`) only understands `main-thread-ref`,
`main-thread-bind<event>` (→ `SET_WORKLET_EVENT`), and generic `SET_PROP`.
A `:main-thread-gesture` / `:gesture` attribute would fall through to a no-op
(or a meaningless `SET_PROP`). So **the React gesture DSL does not work here.**

### `enableNewGesture` is hardcoded off
Even the native path is gated: vue-lynx's build plugin
(`plugin/dist/index.js`, in the `LynxTemplatePlugin` options block) sets
`enableNewGesture: false`. We flip it to `true` by extending
`patches/vue-lynx@0.4.0.patch` (pnpm `patchedDependencies`).

## How vyui wires it

`enableNewGesture: true` is **necessary but not sufficient** — vue-lynx never
emits `__SetGestureDetector`. So we install the detector **ourselves** from a
main-thread worklet, against the raw element behind a `:main-thread-ref` (its
`.current` inside a worklet IS the live Lynx element — the same handle
`setStyleProperty` is called on; confirmed in vue-lynx
`main-thread/dist/worklet-apply.js` `applySetMtRef`).

Split, dictated by the project's worklet constraints:

- **`@/shared/gesture/gestureArbitration.ts`** (shared `.ts`): types, the pure
  consume-vs-intercept policy (`shouldInterceptGesture`), and
  `installGestureDetector` — a `'main thread'` function that calls
  `__SetAttribute(el, 'has-react-gesture', true)` / `flatten=false` and
  `__SetGestureDetector(el, id, 7 /* NATIVE */, config, relationMap)`. It does
  no per-frame work and resolves no cross-file callbacks, so importing it into a
  worklet is safe. `GestureTypeInner.NATIVE` is inlined as the literal `7`
  because vue-lynx's worklet loader does **not** follow bare package imports
  into the MT realm.
- **`FeedList.vue`** (SFC): the gesture's touch callbacks
  (`onBegin`/`onUpdate`/`onEnd`) are **inlined `'main thread'` worklets** —
  vue-lynx's loader skips MT functions imported from workspace `.ts`, so they
  must live in the SFC. They paint the rubber-band (`setStyleProperty`), call
  `interceptGesture`/`consumeGesture` to own/release the touch, and hop pull
  progress + trigger events back to BG. Only PURE maths is mirrored from
  `physics.ts` (`rubberEffect`), kept in sync by hand (a unit test pins it).

The detector is installed in `onMounted` via `runOnMainThread(_installGesture)`
once the element-ref / worklet-ctx ops have flushed to MT.

### Consume vs intercept (SDK branch)
Mirrors lynx-ui's `useRefresh`: on SDK `< 3.3` the inner `consumeGesture(own)`
call is used; on `>= 3.3` the outer `interceptGesture(own)` call (which takes
ownership from the *native* scroller) is correct. The SDK is read on MT in
`_installGesture` (inlined `SystemInfo.engineVersion` parse, mirroring
`mtsNativeLynxSDKVersionLessThan('3.3')`) and stored in an MT ref the callbacks
read.

### `selectorMT`
lynx-ui's `selectorMT(id)` resolves an element from the MT registry. vue-lynx
does not export that registry, and `:main-thread-ref` already gives us the
element directly — so we deliberately **do not** add `@lynx-js/lynx-ui-common`.
The ref-unwrap is the `selectorMT` equivalent. A future sibling-by-id lookup
would use vue-lynx `querySelector('#id')` (BG) or an extra `:main-thread-ref`.

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

Lifecycle: consumer sets `refreshing = false` to end → engine springs the
header closed → state goes `'done'` then `'idle'`.

## Device-verification checklist (CANNOT run under vitest — no device)

The build and unit tests cover: the state machine, prop/emit/slot wiring, the
consume-vs-intercept policy, and the rubber-band maths. They do **not** and
cannot cover anything that needs the real gesture/MT engine. Verify on an
**iOS simulator** (and ideally Android):

1. **Gesture binds at all.** That `__SetGestureDetector` installed from a
   vue-lynx worklet actually registers a recognizer (the whole approach hinges
   on this — it is reverse-engineered from React-Lynx's `processGesture`, never
   run). If `onUpdate` never fires, the binding failed.
2. **Worklet-ctx callbacks dispatch.** That the inline SFC worklets passed as
   `config.callbacks[].callback` are invoked by the engine with
   `(event, stateManager)` and that `stateManager.interceptGesture/consumeGesture`
   exist and work.
3. **`event.params` shape.** That `params.deltaY`, `params.isAtStart` are
   populated as assumed (typed from gesture-runtime's `NativeGestureChangeEvent`,
   not observed).
4. **Arbitration correctness.** Pulling down at the top owns the touch and shows
   the rubber-band; normal scrolling and load-more still work (gesture released
   when not at top / not pulling).
5. **Threshold + release.** Cross `refreshThreshold` → `refresh` fires once,
   header holds; release below → springs back to idle.
6. **End-of-refresh spring.** Setting `refreshing = false` springs the header
   closed and lands on `idle` (via `done`).
7. **`enableBounce`** overscroll at both edges (the bounce branch is wired but
   the most lightly exercised).
8. **SDK branch** on both an SDK `< 3.3` and `>= 3.3` runtime.

## Uncertainty / open risks

- **vue-lynx gesture-binding syntax**: there is **no** `:main-thread-gesture`
  template syntax in vue-lynx (confirmed by reading its runtime + plugin). The
  manual `__SetGestureDetector` install is the intended substitute, but it is
  unverified on device (item 1 above). If it proves not to register, the
  fallback is the native `<refresh>` wrapper (still crash-prone on iOS) or
  contributing a real gesture transform upstream to vue-lynx.
- **Callback worklet registration**: React-Lynx registers gesture callbacks via
  `onWorkletCtxUpdate`; we rely on the worklet ctxs being transferable as
  `runOnMainThread` params. This matches how vue-lynx serializes worklet ctxs,
  but the engine-side `__SetGestureDetector` consuming them is unproven here.
