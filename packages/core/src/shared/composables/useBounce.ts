// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui`
// `packages/lynx-ui-scroll-view/src/hooks/useBounce.tsx` (Apache-2.0).
//
// Adapted for vyui:
//   - The upstream hook returns `main-thread:bind*` handler worklets. In
//     vue-lynx, `'main thread'` functions that live in a `.ts` workspace
//     module are NOT registered by the worklet loader (see MEMORY:
//     island-morph-native-animation). So the gesture/animation worklets MUST
//     be inlined in `ScrollView.vue` — they cannot live here.
//   - What lives here instead: the public prop/event surface (types,
//     constants, defaults) and the *pure* helper math the SFC worklets call
//     by value. Keeping the maths here makes it unit-testable without an MT
//     runtime (mirrors how SwipeAction tests its `decide()` logic).

/** Direction passed to the `scrollToBounces` event. */
export interface ScrollToBouncesInfo {
  direction: 'upper' | 'lower'
}

/**
 * Which edge(s) may bounce.
 * - `both` — bounce at top and bottom (default).
 * - `upper` / `lower` — bounce at one edge only.
 * - `none` — disable the custom bounce entirely.
 * - `iOSBounces` — defer to the platform's native bounce (no MT override).
 */
export type SingleSidedBounce = 'upper' | 'lower' | 'both' | 'iOSBounces' | 'none'

/**
 * Bounce configuration. Mirrors lynx-ui's `BounceableBasicProps`.
 */
export interface BounceableBasicProps {
  /** Enable the custom main-thread bounce/overscroll effect. */
  enableBounces: boolean
  /**
   * Fire `scrollToBounces` when the bounce is reached during a fling (i.e.
   * with no finger down), not only during a drag.
   * @defaultValue `true`
   */
  enableBounceEventInFling?: boolean
  /**
   * Overscroll distance (px) past the upper edge needed to fire
   * `scrollToBounces` with `{ direction: 'upper' }`.
   * @defaultValue `0`
   */
  startBounceTriggerDistance?: number
  /**
   * Overscroll distance (px) past the lower edge needed to fire
   * `scrollToBounces` with `{ direction: 'lower' }`.
   * @defaultValue `0`
   */
  endBounceTriggerDistance?: number
  /**
   * Allow bouncing even when the content is smaller than the viewport.
   * @defaultValue `true`
   */
  alwaysBouncing?: boolean
  /**
   * Which edge(s) may bounce.
   * @defaultValue `'both'`
   */
  singleSidedBounce?: SingleSidedBounce
  /**
   * Size hint (px) for the bounce maths before the first layout pass.
   * Recommended inside `List` / `<list/>`.
   */
  estimatedHeight?: number
  /** Size hint (px) for horizontal bounce maths before first layout. */
  estimatedWidth?: number
}

/** Animation tuning constants. Match lynx-ui's `useBounce` defaults. */
export const BOUNCE_CONSTANTS = {
  /** Rubber-band damping — smaller = stiffer spring. */
  rubberC: 0.55,
  /** Fling deceleration per ms — smaller = stops sooner. */
  flingDeceleratingRate: 0.99,
  /** Rebound speed — larger = snaps back faster. */
  beta: 15,
} as const

/** Status returned by `getBouncingStatus`. */
export const BOUNCING_STATUS = {
  inScrollingRange: 0,
  upperBouncing: 1,
  lowerBouncing: 2,
  noBouncing: 3,
  alwaysBouncing: 4,
} as const

export type BouncingStatusValue =
  (typeof BOUNCING_STATUS)[keyof typeof BOUNCING_STATUS]

/**
 * Rubber-band displacement for a raw drag delta. Pure port of lynx-ui's
 * `rubberEffect` core formula. `frameSize` is the viewport extent along the
 * scroll axis; `delta` is the (signed-removed) drag distance past the edge.
 * Returns a non-negative magnitude — the caller applies the sign.
 */
export function rubberBandingDistance(
  frameSize: number,
  delta: number,
  rubberC: number = BOUNCE_CONSTANTS.rubberC,
): number {
  return Math.max(
    0,
    (1.0 - 1.0 / ((delta * rubberC) / frameSize + 1.0)) * frameSize,
  )
}

/**
 * Decide which bounce edge the current offset sits at. Pure port of
 * lynx-ui's `getBouncingStatus`.
 */
export function getBouncingStatus(opts: {
  currentOffset: number
  toUpper: boolean
  toLower: boolean
  alwaysBouncing: boolean
}): BouncingStatusValue {
  const { currentOffset, toUpper, toLower, alwaysBouncing } = opts
  if (toUpper && toLower) {
    return alwaysBouncing
      ? BOUNCING_STATUS.alwaysBouncing
      : BOUNCING_STATUS.noBouncing
  }
  if (currentOffset > 0) return BOUNCING_STATUS.upperBouncing
  if (currentOffset < 0) return BOUNCING_STATUS.lowerBouncing
  return BOUNCING_STATUS.inScrollingRange
}

/**
 * Whether the touch-end / fling sequence should bounce back. Pure port of
 * lynx-ui's `shouldBounceWhenTouchEnd`.
 */
export function shouldBounceWhenTouchEnd(
  status: BouncingStatusValue,
  alwaysBouncing: boolean,
): boolean {
  if (
    status === BOUNCING_STATUS.inScrollingRange
    || status === BOUNCING_STATUS.noBouncing
  ) {
    return false
  }
  if (
    status === BOUNCING_STATUS.upperBouncing
    || status === BOUNCING_STATUS.lowerBouncing
  ) {
    return true
  }
  if (status === BOUNCING_STATUS.alwaysBouncing) return alwaysBouncing
  return false
}

/**
 * Whether the current overscroll magnitude has crossed the configured
 * trigger distance for its edge — i.e. should `scrollToBounces` fire. Pure
 * port of lynx-ui's `isOverTriggerDistance`.
 */
export function isOverTriggerDistance(opts: {
  bouncingOffset: number
  startBounceTriggerDistance: number
  endBounceTriggerDistance: number
  pixelRatio: number
}): boolean {
  const {
    bouncingOffset,
    startBounceTriggerDistance,
    endBounceTriggerDistance,
    pixelRatio,
  } = opts
  const triggerDistance = bouncingOffset > 0
    ? startBounceTriggerDistance
    : endBounceTriggerDistance
  const delta = Math.abs(bouncingOffset) - Math.abs(triggerDistance)
  return delta > 1.0 / pixelRatio
}
