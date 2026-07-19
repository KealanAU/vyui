/**
 * Snap-and-drag math for edge-anchored overlays (`Sheet` and its kit
 * wrappers). Pure, unit-tested spec functions: Sheet's BG side calls
 * them directly; its MT worklets keep inline copies of the release
 * math (SWC's worklet transform can't follow imports from a regular
 * module — see `SheetContentImpl.vue`).
 *
 * ## Coordinate system
 *
 * All positions are expressed in **px along the drag axis, measured
 * from the sheet's fully-open state**. `0` = sheet at its anchored
 * edge (fully visible). `travel` = sheet pushed entirely off-screen.
 * Direction (top/bottom/left/right) only affects how that axis maps
 * to screen pixels — the math here is direction-agnostic once you
 * give it `travel`.
 *
 * ## Velocity convention
 *
 * `px/s`, positive = toward close.
 */

import { clamp } from '../clamp.js'

export type SheetDirection = 'top' | 'bottom' | 'left' | 'right'

/**
 * A snap point. Either a fraction of the sheet's full travel that is
 * **visible** (`0`–`1`, where `1` = fully open), or a literal pixel
 * height/width as a string (`'320px'`).
 */
export type SheetSnap = number | string

// --- Pure helpers --------------------------------------------------------

export function directionAxis(direction: SheetDirection): 'x' | 'y' {
  return direction === 'left' || direction === 'right' ? 'x' : 'y'
}

/**
 * Sign multiplier that turns a raw axis delta into "distance toward closed."
 * For `bottom` and `right` drawers, dragging in the positive axis direction
 * closes; for `top` and `left`, dragging in the negative direction closes.
 */
export function directionCloseSign(direction: SheetDirection): 1 | -1 {
  return direction === 'bottom' || direction === 'right' ? 1 : -1
}

/**
 * Resolve a single snap point to a position in px-from-open.
 *
 * - Number `n` (`0`–`1`) → `(1 - n) * travel`. `n = 1` means fully open
 *   (position 0); `n = 0` means fully closed (position `travel`).
 * - String `'Npx'` → `travel - N`. The sheet shows `N` pixels measured
 *   from its anchored edge.
 *
 * Returns `0` for invalid input or non-positive `travel` — safe fallback
 * for layout-not-yet-measured paths.
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

/**
 * Resolve, clamp, and sort an array of snaps to ascending positions
 * (`[0]` = most open, `[last]` = most closed).
 */
export function resolveSnapPositions(
  snaps: readonly SheetSnap[],
  travel: number,
): number[] {
  return snaps
    .map(sp => resolveSnapToPosition(sp, travel))
    .sort((a, b) => a - b)
}

/**
 * Map `SheetRoot`-style snap fractions (of **viewport** height, any order)
 * to px-from-open positions along the panel's travel. The panel is sized to
 * the largest snap (`travel = maxSnap × viewportHeight`), so the largest
 * fraction always maps to position `0` (fully open) and smaller fractions
 * to positive offsets. Returns ascending positions (`[0]` = most open),
 * ready for `pickRelease`.
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
   * Velocity (px/s, toward close) at which a fling triggers dismiss when
   * past the most-closed snap. Set to `Infinity` to disable velocity-based
   * dismiss.
   */
  dismissVelocity: number
  /**
   * Pixels past the most-closed snap at which a release dismisses, even
   * with no velocity. Useful for mouse drags where flick velocity is rare.
   */
  dismissThreshold: number
  /**
   * Milliseconds of inertial coast applied to the release for snap
   * selection. Higher values bias toward direction-of-fling targets.
   * Defaults to `100`.
   */
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
 * Decide where to settle on release. Inputs are in normalized coordinates
 * (px-from-open) and px/s velocity. Returns the chosen snap (or dismiss).
 *
 * Algorithm:
 *
 * 1. Project a short coast: `projected = position + velocity * coastMs/1000`.
 * 2. Dismiss if any of:
 *    - velocity > `dismissVelocity` (hard fling toward close)
 *    - projected past most-closed snap by `dismissThreshold` px
 *    - already past most-closed by ≥ 15 px AND not actively pulling back
 *      (mouse-friendly fallback — desktop drags rarely have fling velocity)
 * 3. Otherwise pick the snap nearest `projected`. The projection naturally
 *    implements a "flick advances one snap" behavior without a separate
 *    velocity-threshold rule — a real flick's coast carries it past the
 *    midpoint to the next snap.
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
      // Pulling back is a negative velocity (toward open); `-50 px/s`
      // is the "barely held back" threshold. Anything less negative
      // and we treat the release as a deliberate dismiss.
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
