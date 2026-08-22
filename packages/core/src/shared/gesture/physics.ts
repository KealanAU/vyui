// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Shared, pure gesture physics — the unit-tested spec mirrored by the
// `'main thread'` worklets that drive drag components (Swiper, Sheet, …), which
// cannot import across the worklet boundary. Adapted from
// `lynx-family/lynx-ui` `packages/lynx-ui-swiper` (Apache 2.0).
//
// `decideSnapTarget` is the uniform-paging (carousel) specialization; the sheet
// family's arbitrary-snap release spec lives in `useSheetBehavior.pickRelease`.

/** Upstream: `const/index.ts` — slop before axis lock engages. */
export const GESTURE_THRESHOLD = 8

/** Upstream: `useOffset.ts:469` — flick threshold. */
export const VELOCITY_THRESHOLD_DEFAULT = 300

/**
 * Multi-step snap rounding. `threshold=0.5` rounds 1.4→1, 1.6→2;
 * `threshold=0.95` favors the lower integer. Upstream: `useOffset.ts:65`.
 */
export function customRound(num: number, threshold = 0.5): number {
  'main thread'
  const decimal = num - Math.floor(num)
  if (decimal >= threshold)
    return Math.ceil(num)
  return Math.floor(num)
}

/**
 * Rubber-band resistance curve — the dampened delta felt when overscrolling
 * past a boundary. Effective drag is capped at `2 * bounceWidth`; output
 * approaches `1.5 * bounceWidth` asymptotically. Upstream: `useOffset.ts:77-94`.
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

/** Clamp an offset to the swiper's valid range; loop mode never clamps.
 *  Upstream: `useOffset.ts:185-210`. */
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
 * Rubber-band past a boundary, else clamp — the offset the user sees during
 * touchmove. Upstream: `useOffset.ts:212-226`.
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
 * Snap target offset for a released swipe (no velocity). `rounding` is the
 * fraction-of-an-item past which the snap rounds up (0.5 default). Returns the
 * boundary-clamped offset when the user has dragged off-screen.
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

export interface LoopRebase {
  /** Animate-from offset, shifted into the same loop period as `finalOffset`. */
  offset: number
  /** Animate-to offset, kept seamless across the first↔last seam. */
  finalOffset: number
}

/**
 * Seam-aware loop rebasing — the heart of seamless (non-snapping) looping.
 *
 * The track holds the real slides PLUS `loopDuplicateCount` cloned edge slides
 * per side. When a step would settle into that clone region, BOTH the
 * animate-from and animate-to offsets shift by one full content width: the
 * visible motion is unchanged, but the destination lands back inside the real
 * range so the NEXT gesture continues seamlessly. `totalWidth` is one full
 * period. Upstream: `useOffset.ts:240-263` (`calcLoop`).
 */
export function calcLoop(
  start: number,
  end: number,
  totalWidth: number,
  count: number,
): LoopRebase {
  'main thread'
  if (count === 0 || totalWidth === 0)
    return { offset: 0, finalOffset: 0 }
  const fullSize = totalWidth / count
  let offset = start
  let finalOffset = end
  if (finalOffset < -totalWidth + fullSize) {
    // Past the last item (e.g. item n) → rebase forward to item 0's period.
    finalOffset += totalWidth
    offset += totalWidth
  }
  else if (finalOffset > 0) {
    // Before the first item (e.g. item -1) → rebase back to item n-1's period.
    finalOffset -= totalWidth
    offset -= totalWidth
  }
  return { offset, finalOffset }
}

/**
 * Drop samples older than `ms`, keeping at least `minLength` (so sparse
 * touchmove still yields a release velocity). Mutates in place.
 * Upstream: `useVelocity.ts:22-33`.
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
 * Velocity (px/s) from position/time queues; 0 with fewer than two samples or a
 * non-positive window. RTL flips the sign so positive = "forward".
 * Upstream: `useVelocity.ts:35-55`.
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
 * Test if `angle` (degrees, -180..180) falls in any of the wrap-aware ranges —
 * axis lock's "horizontal enough" test. Upstream: `useAxisLock.ts:12-21`.
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
 * Resolve axis-lock state for a touchmove. `null` means the gesture hasn't
 * crossed `GESTURE_THRESHOLD` yet — keep waiting.
 * Upstream: `useAxisLock.ts:46-73`.
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
  /** Fraction of `fullSize` past which a release snaps one item further. */
  threshold: number
  /** Absolute velocity (px/s) above which a flick wins. */
  velocityThreshold: number
}

/**
 * Final index for a released swipe; velocity flick wins over the position-based
 * snap. Mirrors gospel's `handleTouchEnd` + `handleVelocity`.
 */
export function decideSnapTarget(opts: SnapTargetOpts): number {
  'main thread'
  const { startOffset, endOffset, fullSize, count, loop, velocity, threshold, velocityThreshold } = opts
  if (count === 0)
    return 0

  // Position-based: snap to the page nearest the current offset.
  const snappedOffset = calcPaging(endOffset, fullSize, count, loop, threshold)
  let target = Math.round(-snappedOffset / fullSize)

  // Velocity flick overrides — advance/retreat one step from where the user
  // grabbed, but only if the flick is in a direction with room.
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

/** Upstream: `utils/index.ts:7` — cubic ease-out for snap animation. */
export function easeOutCubic(progress: number): number {
  'main thread'
  return 1 - (1 - progress) ** 3
}

/**
 * Project where a released drag coasts to under exponential friction: the
 * closed form of v(t) = v0 * e^(-decel*t) integrated to rest, `v0 / decel` (the
 * model iOS UIScrollView uses). Higher `decel` → shorter fling.
 */
export function projectMomentum(position: number, velocity: number, decel = 5): number {
  'main thread'
  if (decel <= 0)
    return position
  return position + velocity / decel
}

/**
 * Settle duration (ms) for a released drag, `distance / speed` clamped to
 * `[minMs, maxMs]`: a hard flick settles quicker, a slow release keeps the
 * unflicked feel. Sign-agnostic. Mirrored inline by `SheetContentImpl`'s
 * `_onTouchEnd` worklet (worklets can't call across files — keep in sync).
 */
export function settleDurationMs(
  remainingPx: number,
  velocity: number,
  maxMs: number,
  minMs = 120,
): number {
  'main thread'
  const speed = Math.max(Math.abs(velocity), 1e-3)
  const ms = (Math.abs(remainingPx) / speed) * 1000
  if (ms < minMs)
    return minMs
  if (ms > maxMs)
    return maxMs
  return ms
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
 * Velocity-aware release decision for SwipeAction: a hard leftward flick
 * commits, a softer one (or a drag past the open threshold) snaps open, a
 * rightward flick or short drag closes. Pure mirror of `_onTouchEnd` in
 * `SwipeAction.vue`, kept here so the decision is unit-testable. Mirrors lynx-ui
 * `swipeWithEasingInOut` / `swipeCancelDueToSmallVelocity`.
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
 * Clamp a Sortable target index, with a velocity-aware overshoot: a fast flick
 * lets the drop land one row further in the direction of travel, so a quick
 * toss "throws" the row rather than dropping it short. `rawTarget` is the
 * pointer-derived target (startIdx + round(dy/itemH)).
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
 * Per-frame autoscroll delta for a drag near a list edge: negative near the top,
 * positive near the bottom, 0 in the dead zone. Speed ramps linearly from 0 at
 * the band's inner boundary to `maxSpeed` at the very edge.
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
