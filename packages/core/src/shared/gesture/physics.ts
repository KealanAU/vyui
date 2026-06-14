// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Shared, pure gesture physics — the unit-tested spec mirrored by the
// `'main thread'` worklets that drive drag components (Swiper, Sheet, …).
// Extracted so the math can be tested without the `:main-thread-bind*` MT
// worklet pipeline (which crashes under vitest — see #6). Adapted from
// `lynx-family/lynx-ui` `packages/lynx-ui-swiper` (Apache 2.0); see
// `src/hooks/useOffset.ts`, `src/hooks/useVelocity.ts`, `src/hooks/useAxisLock.ts`,
// `src/utils/index.ts`.
//
// `decideSnapTarget` is the uniform-paging (carousel) specialization;
// `pickSnap` is the generic candidate-based form that also serves
// arbitrary snap points + dismiss (Sheet/drawer). See #37.

/** Gospel: `const/index.ts` — slop before axis lock engages. */
export const GESTURE_THRESHOLD = 8

/** Gospel: `const/index.ts` — drag below this is a tap, not a swipe. */
export const TAP_THRESHOLD = 8

/** Gospel: `useOffset.ts:469` — flick threshold. */
export const VELOCITY_THRESHOLD_DEFAULT = 300

/**
 * Multi-step snap rounding. `threshold=0.5` rounds 1.4→1, 1.6→2.
 * `threshold=0.95` favors the lower integer (gospel uses this for
 * `swipeNext` to be aggressive about forward snapping).
 *
 * Gospel: `useOffset.ts:65`.
 */
export function customRound(num: number, threshold = 0.5): number {
  'main thread'
  const decimal = num - Math.floor(num)
  if (decimal >= threshold)
    return Math.ceil(num)
  return Math.floor(num)
}

/**
 * Rubber-band resistance curve. Returns the dampened delta the user
 * actually feels when overscrolling past a boundary.
 *
 * Gospel: `useOffset.ts:77-94`.
 *
 * `bounceWidth` is the natural maximum bounce; effective drag is capped
 * at `2 * bounceWidth` and the curve is `delta / (delta / bounceWidth + 1)`
 * scaled by 1.5. Output approaches `1.5 * bounceWidth` asymptotically.
 */
export function rubberEffect(rubberDelta: number, bounceWidth: number): number {
  'main thread'
  if (rubberDelta === 0 || bounceWidth === 0)
    return 0
  const swipeLimit = bounceWidth * 2
  const scaleFactor = 1.5
  const absDelta = Math.abs(rubberDelta)
  const effectiveDelta = Math.min(absDelta, swipeLimit)
  const bounce = effectiveDelta / (effectiveDelta / bounceWidth + 1)
  return Math.sign(rubberDelta) * bounce * scaleFactor
}

export interface LimitResult {
  /** Offset clamped to `[startOffset, endOffset]` when `!loop`. */
  offset: number
  /** -1: hit start. 0: in range. 1: hit end. */
  reachingLimit: -1 | 0 | 1
}

/**
 * Clamp an offset to the swiper's valid range. Loop mode never clamps.
 *
 * Gospel: `useOffset.ts:185-210`.
 */
export function calcLimit(
  offset: number,
  fullSize: number,
  count: number,
  loop: boolean,
): LimitResult {
  'main thread'
  if (count === 0)
    return { offset: 0, reachingLimit: 0 }
  if (loop)
    return { offset, reachingLimit: 0 }
  const startOffset = 0
  const endOffset = -fullSize * (count - 1)
  if (offset >= startOffset)
    return { offset: startOffset, reachingLimit: -1 }
  if (offset <= endOffset)
    return { offset: endOffset, reachingLimit: 1 }
  return { offset, reachingLimit: 0 }
}

/**
 * Apply rubber-band when the user has dragged past a boundary, else clamp.
 * Returns the offset the user should actually see during touchmove.
 *
 * Gospel: `useOffset.ts:212-226`.
 */
export function applyBounce(
  rawOffset: number,
  fullSize: number,
  count: number,
  loop: boolean,
  enableBounce: boolean,
  bounceWidth: number,
): number {
  'main thread'
  const { offset: limitOffset, reachingLimit } = calcLimit(rawOffset, fullSize, count, loop)
  if (!enableBounce || reachingLimit === 0)
    return limitOffset
  const bounceDelta = rawOffset - limitOffset
  return limitOffset + rubberEffect(bounceDelta, bounceWidth)
}

/**
 * Compute the snap target offset for a released swipe (no velocity).
 * `rounding` is the fraction-of-an-item past which the snap rounds up
 * (0.5 default — gospel `useOffset.ts:230`).
 *
 * Returns the boundary-clamped offset when the user has dragged off-screen.
 */
export function calcPaging(
  offset: number,
  fullSize: number,
  count: number,
  loop: boolean,
  rounding = 0.5,
): number {
  'main thread'
  const { offset: limitOffset, reachingLimit } = calcLimit(offset, fullSize, count, loop)
  if (reachingLimit !== 0)
    return limitOffset
  return customRound(-offset / fullSize, rounding) * -fullSize
}

/**
 * Drop samples older than `ms` from the velocity queues, keeping at
 * least `minLength` samples (so sparse touchmove still produces a
 * release velocity from the latest two points).
 *
 * Mutates `positions` and `times` in place. Gospel: `useVelocity.ts:22-33`.
 */
export function pruneQueue(
  positions: number[],
  times: number[],
  ms: number,
  minLength: number,
  now: number,
): void {
  'main thread'
  while (times.length > minLength && times[0] < now - ms) {
    times.shift()
    positions.shift()
  }
}

/**
 * Compute velocity (px/s) from position/time queues. Returns 0 if fewer
 * than two samples, or if the time window is non-positive. Gospel:
 * `useVelocity.ts:35-55`.
 *
 * RTL flips the sign so positive = drag in the "forward" reading
 * direction regardless of layout.
 */
export function calcVelocity(positions: number[], times: number[], rtl = false): number {
  'main thread'
  const { length } = times
  if (length < 2)
    return 0
  const distance = rtl
    ? positions[0] - positions[length - 1]
    : positions[length - 1] - positions[0]
  const timeSec = (times[length - 1] - times[0]) / 1000
  if (timeSec <= 0)
    return 0
  return distance / timeSec
}

/**
 * Test if `angle` (degrees, -180..180) falls in any of the wrap-aware
 * ranges. Used by axis lock to decide whether a gesture is "horizontal
 * enough" to consume.
 *
 * Gospel: `useAxisLock.ts:12-21`.
 */
export function isAngleInRanges(angle: number, ranges: [number, number][]): boolean {
  'main thread'
  for (let i = 0; i < ranges.length; i++) {
    const [start, end] = ranges[i]
    if (start <= end) {
      if (angle >= start && angle <= end)
        return true
    }
    else {
      // Wrap-around range, e.g. [135, -135].
      if (angle >= start || angle <= end)
        return true
    }
  }
  return false
}

/** Default `consumeSlideEvent` ranges: ±45° around the horizontal axis. */
export const HORIZONTAL_CONSUME_RANGES: [number, number][] = [
  [-180, -135],
  [-45, 45],
  [135, 180],
]

export type AxisLockState =
  | { gestureLocked: false, axisLocked: false }
  | { gestureLocked: true, axisLocked: false }
  | { gestureLocked: true, axisLocked: true }

/**
 * Resolve axis-lock state for a touchmove. Returns `null` if the gesture
 * hasn't crossed `GESTURE_THRESHOLD` yet — caller should keep its existing
 * state and continue waiting.
 *
 * Gospel: `useAxisLock.ts:46-73`.
 */
export function resolveAxisLock(
  deltaX: number,
  deltaY: number,
  ranges: [number, number][],
): AxisLockState | null {
  'main thread'
  const displacement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  if (displacement <= GESTURE_THRESHOLD)
    return null
  const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI
  if (isAngleInRanges(angle, ranges))
    return { gestureLocked: true, axisLocked: false }
  return { gestureLocked: true, axisLocked: true }
}

export interface SnapTargetOpts {
  /** Offset at touchstart. */
  startOffset: number
  /** Offset at touchend, after any bounce. */
  endOffset: number
  /** Width of one item including spacing. */
  fullSize: number
  /** Total item count. */
  count: number
  /** Allow looping past the ends. */
  loop: boolean
  /** Velocity at release (px/s, positive = drag right). */
  velocity: number
  /**
   * Fraction of `fullSize` past which a release snaps one item further.
   * Only used as the `customRound` threshold for the position-based snap.
   */
  threshold: number
  /** Absolute velocity (px/s) above which a flick wins. */
  velocityThreshold: number
}

/**
 * Decide the final index for a released swipe. Velocity flick wins over
 * the position-based snap. Multi-step drags are honored via `calcPaging`.
 *
 * Mirrors gospel's `handleTouchEnd` (`useOffset.ts:536-563`) +
 * `handleVelocity` (`:467-495`), reduced to a pure index computation.
 */
export function decideSnapTarget(opts: SnapTargetOpts): number {
  'main thread'
  const { startOffset, endOffset, fullSize, count, loop, velocity, threshold, velocityThreshold } = opts
  if (count === 0)
    return 0

  // Position-based: snap to the page nearest the current offset.
  const snappedOffset = calcPaging(endOffset, fullSize, count, loop, threshold)
  let target = Math.round(-snappedOffset / fullSize)

  // Velocity flick overrides — advance/retreat one step from where the
  // user grabbed, but only if the flick is in a direction with room.
  if (Math.abs(velocity) >= velocityThreshold) {
    const startIdx = Math.round(-startOffset / fullSize)
    // Negative velocity = drag left = move forward to next.
    target = startIdx + (velocity < 0 ? 1 : -1)
  }

  if (loop) {
    const m = ((target % count) + count) % count
    return m
  }
  if (target < 0)
    return 0
  if (target > count - 1)
    return count - 1
  return target
}

export interface PickSnapOpts {
  /** Absolute velocity (px/s) above which a flick advances one candidate. */
  velocityThreshold: number
}

/**
 * Generic candidate-based snap. Picks the resting offset nearest the release
 * `position`; a flick (`|velocity| >= velocityThreshold`) advances one
 * candidate in the direction of travel instead. Velocity sign is in offset
 * space (positive = offset increasing).
 *
 * This is the policy-agnostic generalization of `decideSnapTarget`: the
 * caller supplies the allowed resting offsets, so it serves both a carousel
 * (uniform item offsets) and a Sheet/drawer (arbitrary snap-point offsets,
 * with "dismiss" expressed as just another candidate). Returns the chosen
 * offset — the caller maps it back to an index / open-state in `onSettle`.
 */
export function pickSnap(
  position: number,
  velocity: number,
  candidates: number[],
  { velocityThreshold }: PickSnapOpts,
): number {
  'main thread'
  if (candidates.length === 0)
    return position

  let nearest = candidates[0]
  for (let i = 1; i < candidates.length; i++) {
    if (Math.abs(candidates[i] - position) < Math.abs(nearest - position))
      nearest = candidates[i]
  }

  if (Math.abs(velocity) < velocityThreshold)
    return nearest

  // Flick: step one candidate in the direction of travel.
  const sorted = candidates.slice().sort((a, b) => a - b)
  const next = sorted[sorted.indexOf(nearest) + (velocity > 0 ? 1 : -1)]
  return next === undefined ? nearest : next
}

/** Gospel: `utils/index.ts:7` — cubic ease-out for snap animation. */
export function easeOutCubic(progress: number): number {
  'main thread'
  return 1 - (1 - progress) ** 3
}

/**
 * Project where a released drag would coast to under exponential friction.
 * `position` is the offset at release, `velocity` is px/s. `decel` is the
 * deceleration rate (px/s² equivalent expressed as a fraction retained per
 * second); higher `decel` → shorter fling. Returns the projected resting
 * offset.
 *
 * The closed-form of v(t) = v0 * e^(-decel*t) integrated to rest:
 *   distance = v0 / decel
 * (the same model iOS UIScrollView uses). Used by Draggable's momentum
 * release and any free-pan surface that wants a flick to keep coasting
 * instead of stopping dead at the finger.
 */
export function projectMomentum(position: number, velocity: number, decel = 5): number {
  'main thread'
  if (decel <= 0)
    return position
  return position + velocity / decel
}

export type SwipeActionDecision = 'commit' | 'open' | 'close'

export interface SwipeActionDecisionOpts {
  /** Row translateX at release. 0 = closed; negative = revealed. */
  endX: number
  /** Release velocity px/s along X (negative = leftward / opening). */
  velocity: number
  /** Width of the revealed action panel, px. */
  actionWidth: number
  /** Width of the full row, px. */
  rowWidth: number
  /** Fraction of `actionWidth` past which a slow release snaps open. */
  snapThreshold: number
  /** Fraction of `rowWidth` past which a slow release commits. */
  commitThreshold: number
  /** |velocity| px/s above which a flick commits regardless of position. */
  commitVelocity: number
  /** |velocity| px/s above which a flick snaps open/closed. */
  velocityThreshold: number
}

/**
 * Velocity-aware release decision for SwipeAction. A hard leftward flick
 * commits; a softer leftward flick (or a drag past the open threshold) snaps
 * open; a rightward flick or short drag closes. Velocity wins over position
 * so a fast flick from near-closed still triggers the right outcome.
 *
 * Pure mirror of `_onTouchEnd` in `SwipeAction.vue` — kept here so the
 * decision is unit-tested without the MT worklet pipeline. Mirrors lynx-ui
 * `swipeWithEasingInOut` / `swipeCancelDueToSmallVelocity`
 * (`lynx-ui-swipe-action/src/index.tsx`).
 */
export function decideSwipeAction(opts: SwipeActionDecisionOpts): SwipeActionDecision {
  'main thread'
  const { endX, velocity, actionWidth, rowWidth, snapThreshold, commitThreshold, commitVelocity, velocityThreshold } = opts
  const opening = -velocity // positive when dragging leftward (revealing)
  if (opening >= commitVelocity || -endX >= commitThreshold * rowWidth)
    return 'commit'
  // A rightward flick (closing) always wins toward closed, even past the snap
  // threshold — matches the "flick to dismiss" feel of the gospel.
  if (velocity >= velocityThreshold)
    return 'close'
  if (opening >= velocityThreshold || -endX >= snapThreshold * actionWidth)
    return 'open'
  return 'close'
}

/**
 * Clamp a Sortable target index to the valid range, factoring in a
 * velocity-aware overshoot: a fast flick lets the drop land one row further
 * in the direction of travel than the raw pointer offset would, which makes a
 * quick toss feel like it "throws" the row rather than dropping it short.
 *
 * `rawTarget` is the pointer-derived target (startIdx + round(dy/itemH)).
 * `velocity` is px/s along Y (positive = downward). `count` is item count.
 */
export function sortableDropTarget(
  startIdx: number,
  rawTarget: number,
  velocity: number,
  count: number,
  velocityThreshold = VELOCITY_THRESHOLD_DEFAULT,
): number {
  'main thread'
  let target = rawTarget
  if (Math.abs(velocity) >= velocityThreshold) {
    // Bias one row in the flick direction, but never reverse a drag the
    // pointer already committed to.
    const dir = velocity > 0 ? 1 : -1
    if (dir > 0 && target >= startIdx)
      target += 1
    else if (dir < 0 && target <= startIdx)
      target -= 1
  }
  if (target < 0)
    return 0
  if (target > count - 1)
    return count - 1
  return target
}

export interface AutoscrollOpts {
  /** Pointer position within the scroll viewport (px from its top edge). */
  pointer: number
  /** Height of the scroll viewport, px. */
  viewport: number
  /** Distance from an edge (px) within which autoscroll engages. */
  edge: number
  /** Max scroll speed in px/frame at the very edge. */
  maxSpeed: number
}

/**
 * Compute the per-frame autoscroll delta for a drag near a list edge.
 * Returns a negative delta near the top edge (scroll up), positive near the
 * bottom edge (scroll down), and 0 in the dead zone. Speed ramps linearly
 * from 0 at the edge band's inner boundary to `maxSpeed` at the very edge.
 *
 * Mirrors the edge-autoscroll behavior common to drag-and-drop lists; lynx-ui
 * relies on the host ScrollView's native momentum, so this is the vyui port
 * of that affordance for the MT pipeline.
 */
export function autoscrollDelta({ pointer, viewport, edge, maxSpeed }: AutoscrollOpts): number {
  'main thread'
  if (edge <= 0 || viewport <= 0)
    return 0
  if (pointer < edge) {
    const intensity = (edge - pointer) / edge
    return -maxSpeed * Math.max(0, Math.min(1, intensity))
  }
  const bottom = viewport - edge
  if (pointer > bottom) {
    const intensity = (pointer - bottom) / edge
    return maxSpeed * Math.max(0, Math.min(1, intensity))
  }
  return 0
}
