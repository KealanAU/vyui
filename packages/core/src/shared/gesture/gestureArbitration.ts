// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Gesture-arbitration primitive for vue-lynx.
//
// WHY THIS EXISTS
// ---------------
// A native `<list>` / `<scroll-view>` owns its own vertical scroll gesture.
// A hand-rolled rubber-band (pull-to-refresh, overscroll bounce) painted via
// MT `setStyleProperty` fights that native scroller: the moment the user drags
// past an edge the native gesture keeps consuming touches and the custom
// transform never wins. The fix is *gesture arbitration* — register a
// `NativeGesture` on the element and, from the gesture's MT callbacks, tell the
// engine to hand ownership of the touch to us (or back to the native scroller)
// frame by frame. This is what `@lynx-js/gesture-runtime` + the engine's
// "new gesture" pipeline provide (`__SetGestureDetector`, `__ConsumeGesture`).
//
// VUE-LYNX HAS NO GESTURE TRANSFORM
// ---------------------------------
// In React-Lynx, `main-thread:gesture={g}` is a COMPILER feature: the JSX
// transform emits `updateGesture(...)` into the snapshot which calls
// `processGesture` → `__SetGestureDetector(dom, id, type, config, relationMap)`
// and `__SetAttribute(dom, 'has-react-gesture', true)`. vue-lynx ships NO such
// transform and its runtime `patchProp` has no gesture branch (it only knows
// `main-thread-ref`, `main-thread-bind*`, `SET_PROP`, …). So `:main-thread-gesture`
// / `:gesture` do NOT work under vue-lynx.
//
// Instead we install the detector OURSELVES, from a `'main thread'` worklet,
// against the raw element behind a `:main-thread-ref` (its `.current` is the
// live Lynx element — the same handle `setStyleProperty` is called on). The
// engine path is gated behind `enableNewGesture`, which vue-lynx hardcodes OFF;
// vyui flips it ON via `patches/vue-lynx@0.4.0.patch`.
//
// WHAT LIVES WHERE (constraint #1: cross-file MT worklets don't register)
// ----------------------------------------------------------------------
// EVERY worklet that touches the engine — the per-frame touch callbacks AND the
// `__SetGestureDetector` / `__SetAttribute` install call — must be `'main thread'`
// worklets INLINED in the consuming SFC. vue-lynx's worklet loader follows `@/`
// imports but does NOT correctly realm-separate a worklet that lives in a
// workspace `.ts`: the function body lands in the BACKGROUND bundle where the
// MT-only PAPIs are undefined, and the card crashes at load with
// `ReferenceError: __SetAttribute is not defined`. (An earlier revision kept the
// install call here as "pure plumbing" and hit exactly that crash on device.)
// So this module is worklet-FREE — it only provides:
//   - types (`NativeGestureDetectorConfig`, `GestureRelationMap`, …),
//   - the PURE consume-vs-intercept policy (`shouldInterceptGesture`),
//   - PAPI ambient declarations, and
//   - small pure helpers (`emptyRelationMap`).
// The SFC inlines the install worklet and calls `__SetGestureDetector` directly.
//
// SELECTOR
// --------
// lynx-ui's `selectorMT(id)` looks an element up in the MT element registry.
// vue-lynx does not export that registry, and the `:main-thread-ref` already
// gives us the element directly — so we deliberately do NOT depend on
// `@lynx-js/lynx-ui-common`. `selectorMT` here is the ref-based equivalent: it
// just unwraps `ref.current`. If a future need arises to resolve a *sibling*
// element by id from a worklet, vue-lynx's `querySelector('#id')` (BG side) or
// an additional `:main-thread-ref` is the supported path.

/**
 * `GestureTypeInner.NATIVE` from `@lynx-js/gesture-runtime`. Inlined as a
 * literal rather than imported because the value is referenced inside a
 * `'main thread'` worklet, and vue-lynx's worklet loader does NOT follow bare
 * package imports into the MT realm (it follows only relative / `@/` imports —
 * see `patches/vue-lynx@0.4.0.patch`). A bare-import enum reference would be
 * `undefined` on MT. Keep in sync with gesture-runtime's `GestureTypeInner`.
 */
export const GESTURE_TYPE_NATIVE = 7

/** Native gesture-recognizer state, mirrors gesture-runtime `SetGestureStateType`. */
export const GESTURE_STATE_ACTIVE = 1
export const GESTURE_STATE_FAIL = 2
export const GESTURE_STATE_END = 3

/**
 * SDK version at/after which the engine exposes `interceptGesture`
 * (outer/native interception) as the correct arbitration call. Below it, the
 * `consumeGesture` (inner) call is used. Mirrors lynx-ui's `useRefresh`
 * `mtsNativeLynxSDKVersionLessThan('3.3')` branch.
 */
export const GESTURE_INTERCEPT_MIN_SDK = '3.3'

/**
 * Pure consume-vs-intercept policy. `interceptGesture(shouldOwn)` is the
 * SDK ≥ 3.3 API that takes ownership away from the *outer* native scroller;
 * `consumeGesture(shouldOwn)` is the older inner-consume API. Returns `true`
 * when the caller should use `interceptGesture`.
 *
 * Kept pure (no worklet directive, no element access) so it is unit-testable
 * and can be mirrored inline in an SFC worklet.
 */
export function shouldInterceptGesture(sdkLessThan33: boolean): boolean {
  return !sdkLessThan33
}

/** A single serialized native-gesture callback entry, as `__SetGestureDetector` expects. */
export interface GestureCallbackEntry {
  /** `onBegin` | `onStart` | `onUpdate` | `onEnd` | `onTouchesDown` | … */
  name: string
  /** A `'main thread'` worklet `(event, stateManager) => void`. */
  callback: unknown
}

/** Config passed to the native detector. `enabled` defaults true. */
export interface NativeGestureDetectorConfig {
  callbacks: GestureCallbackEntry[]
  config?: Record<string, unknown>
}

/** Relations to other gesture ids (simultaneous / waitFor / continueWith). */
export interface GestureRelationMap {
  waitFor: number[]
  simultaneous: number[]
  continueWith: number[]
}

/**
 * The minimal Lynx element surface a gesture worklet touches. Typed structurally
 * (NOT `HTMLElement` — DOM types leak on Lynx; see project memory) so it works
 * against the raw element behind a `:main-thread-ref`.
 */
export interface GestureElementHandle {
  setStyleProperty?: (k: string, v: string) => void
}

// --- Ambient PAPIs ---------------------------------------------------------
// Provided by the Lynx engine in the MT worklet realm once `enableNewGesture`
// is on. Declared locally because `@lynx-js/types` does not surface them.
declare global {
  /** Install a native gesture detector on `element`. */
  function __SetGestureDetector(
    element: unknown,
    id: number,
    type: number,
    config: NativeGestureDetectorConfig,
    relationMap: GestureRelationMap,
  ): void
  function __SetAttribute(element: unknown, key: string, value: unknown): void
}

// NOTE: the actual install worklet (`__SetAttribute` + `__SetGestureDetector`)
// is INLINED in each consuming SFC, not exported here — see "WHAT LIVES WHERE"
// above for why a `.ts`-resident worklet crashes the card at load.

/**
 * Default relation map (no relations) — the common case for a single
 * arbitrating native gesture on a list/scroll-view.
 */
export function emptyRelationMap(): GestureRelationMap {
  return { waitFor: [], simultaneous: [], continueWith: [] }
}
