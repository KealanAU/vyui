/**
 * Snap-and-drag math for edge-anchored overlays (`Sheet` and its kit wrappers).
 * Pure, unit-tested spec functions: Sheet's BG side calls them directly, while
 * its MT worklets keep inline copies of the release math (SWC's worklet
 * transform can't follow imports — see `SheetContentImpl.vue`).
 *
 * All positions are px along the drag axis measured from the fully-open state:
 * `0` = anchored edge (fully visible), `travel` = entirely off-screen. Velocity
 * is px/s, positive = toward close.
 */

import { clamp } from '../clamp.js'

export type SheetDirection = 'top' | 'bottom' | 'left' | 'right'

/** A snap point: a fraction of full travel that is **visible** (`0`–`1`, `1` =
 *  fully open), or a literal pixel height/width as a string (`'320px'`). */
export type SheetSnap = number | string


export function directionAxis(direction: SheetDirection): 'x' | 'y' {
  return direction === 'left' || direction === 'right' ? 'x' : 'y'
}

/**
 * Sign multiplier that turns a raw axis delta into "distance toward closed":
 * `bottom`/`right` close in the positive axis direction, `top`/`left` in the
 * negative.
 */
export function directionCloseSign(direction: SheetDirection): 1 | -1 {
  return direction === 'bottom' || direction === 'right' ? 1 : -1
}

/**
 * Resolve a single snap point to a position in px-from-open.
 *
 * - Number `n` (`0`–`1`) → `(1 - n) * travel`.
 * - String `'Npx'` → `travel - N` (the sheet shows `N` px from its edge).
 *
 * Returns `0` for invalid input or non-positive `travel`.
 */
export function resolveSnapToPosition(sp: SheetSnap, travel: number): number {
  if (travel <= 0) return 0
  if (typeof sp === 'number') {
    return clamp((1 - sp) * travel, 0, travel)
  }
  const px = Number.parseFloat(sp)
  if (Number.isNaN(px)) return 0
  return clamp(travel - px, 0, travel)
}

/** Resolve, clamp, and sort snaps to ascending positions (`[0]` = most open). */
export function resolveSnapPositions(
  snaps: readonly SheetSnap[],
  travel: number,
): number[] {
  return snaps
    .map(sp => resolveSnapToPosition(sp, travel))
    .sort((a, b) => a - b)
}

/**
 * Map `SheetRoot`-style snap fractions (of **viewport** height, any order) to
 * px-from-open positions. The panel is sized to the largest snap, so the
 * largest fraction maps to position `0`. Returns ascending positions.
 */
export function viewportSnapsToPositions(
  snaps: readonly number[],
  viewportHeight: number,
  travel: number,
): number[] {
  return resolveSnapPositions(
    snaps.map(s => `${s * viewportHeight}px`),
    travel,
  )
}

export interface PickReleaseOptions {
  /** Sorted ascending; `[0]` = most open. */
  snapPositions: readonly number[]
  /** `enableDragToClose === false` disables dismiss regardless of position/velocity. */
  enableDragToClose: boolean
  /**
   * Velocity (px/s, toward close) at which a fling dismisses when past the
   * most-closed snap. `Infinity` disables velocity-based dismiss.
   */
  dismissVelocity: number
  /** Pixels past the most-closed snap at which a release dismisses with no
   *  velocity. Useful for mouse drags, where flick velocity is rare. */
  dismissThreshold: number
  /** Milliseconds of inertial coast applied to the release for snap selection;
   *  higher biases toward direction-of-fling targets. Defaults to `100`. */
  coastMs?: number
}

export interface PickReleaseResult {
  /** Index into `snapPositions`, or `-1` when dismissing. */
  snapIndex: number
  /** Px-from-open position the caller should animate to. */
  targetPosition: number
  /** When true, dismiss the sheet rather than settle at `targetPosition`. */
  dismiss: boolean
}

/**
 * Decide where to settle on release, in px-from-open coordinates and px/s.
 *
 * 1. Project a short coast: `projected = position + velocity * coastMs/1000`.
 * 2. Dismiss if velocity > `dismissVelocity`, or projected past the most-closed
 *    snap by `dismissThreshold` px, or already past it by ≥ 15 px and not
 *    pulling back (mouse-friendly: desktop drags rarely fling).
 * 3. Otherwise pick the snap nearest `projected` — the projection is what makes
 *    a flick advance one snap, with no separate velocity rule.
 */
export function pickRelease(
  position: number,
  velocity: number,
  opts: PickReleaseOptions,
): PickReleaseResult {
  const {
    snapPositions,
    enableDragToClose,
    dismissVelocity,
    dismissThreshold,
    coastMs = 100,
  } = opts

  if (snapPositions.length === 0) {
    return { snapIndex: -1, targetPosition: position, dismiss: false }
  }

  const mostClosed = snapPositions[snapPositions.length - 1]
  const projected = position + (velocity * coastMs) / 1000
  const distPastClosed = position - mostClosed

  const shouldDismiss = enableDragToClose
    && (
      velocity >= dismissVelocity
      || projected > mostClosed + dismissThreshold
      // Pulling back is a negative velocity (toward open); `-50 px/s` is the
      // "barely held back" threshold.
      || (distPastClosed > 15 && velocity > -50)
    )

  if (shouldDismiss) {
    return { snapIndex: -1, targetPosition: mostClosed, dismiss: true }
  }

  let nearestIdx = 0
  let nearestDist = Math.abs(projected - snapPositions[0])
  for (let i = 1; i < snapPositions.length; i++) {
    const d = Math.abs(projected - snapPositions[i])
    if (d < nearestDist) {
      nearestDist = d
      nearestIdx = i
    }
  }
  return {
    snapIndex: nearestIdx,
    targetPosition: snapPositions[nearestIdx],
    dismiss: false,
  }
}
