import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import {
  directionAxis,
  directionCloseSign,
  pickRelease,
  progressFor,
  resolveSnapPositions,
  resolveSnapToPosition,
  useSheetBehavior,
  viewportSnapsToPositions,
} from './useSheetBehavior.js'

describe('directionAxis', () => {
  it('maps top/bottom to y, left/right to x', () => {
    expect(directionAxis('top')).toBe('y')
    expect(directionAxis('bottom')).toBe('y')
    expect(directionAxis('left')).toBe('x')
    expect(directionAxis('right')).toBe('x')
  })
})

describe('directionCloseSign', () => {
  it('returns +1 when the close direction is +axis (bottom/right)', () => {
    expect(directionCloseSign('bottom')).toBe(1)
    expect(directionCloseSign('right')).toBe(1)
  })
  it('returns -1 when the close direction is -axis (top/left)', () => {
    expect(directionCloseSign('top')).toBe(-1)
    expect(directionCloseSign('left')).toBe(-1)
  })
})

describe('resolveSnapToPosition', () => {
  it('treats numeric snaps as fraction-visible', () => {
    expect(resolveSnapToPosition(1, 800)).toBe(0) // fully open
    expect(resolveSnapToPosition(0, 800)).toBe(800) // fully closed
    expect(resolveSnapToPosition(0.5, 800)).toBe(400)
    expect(resolveSnapToPosition(0.9, 800)).toBeCloseTo(80, 5)
  })

  it('treats `Npx` strings as N px visible from the anchored edge', () => {
    expect(resolveSnapToPosition('320px', 800)).toBe(480)
    expect(resolveSnapToPosition('800px', 800)).toBe(0)
  })

  it('clamps results into [0, travel]', () => {
    expect(resolveSnapToPosition(2, 800)).toBe(0) // over-open → 0
    expect(resolveSnapToPosition(-1, 800)).toBe(800) // negative → closed
    expect(resolveSnapToPosition('9999px', 800)).toBe(0)
  })

  it('returns 0 for non-positive travel (layout not yet measured)', () => {
    expect(resolveSnapToPosition(0.5, 0)).toBe(0)
    expect(resolveSnapToPosition('320px', -10)).toBe(0)
  })

  it('returns 0 for malformed strings', () => {
    expect(resolveSnapToPosition('not-a-number', 800)).toBe(0)
  })
})

describe('resolveSnapPositions', () => {
  it('sorts ascending — index 0 = most open, last = most closed', () => {
    // 0.4 fraction → position 480; 0.9 fraction → position 80.
    // After sort: [80, 480] = open → closed.
    const positions = resolveSnapPositions([0.4, 0.9], 800)
    expect(positions).toHaveLength(2)
    expect(positions[0]).toBeCloseTo(80, 5)
    expect(positions[1]).toBe(480)
  })

  it('handles mixed number/string inputs', () => {
    // 200px visible → position 600; 0.5 fraction → position 400.
    expect(resolveSnapPositions([0.5, '200px'], 800)).toEqual([400, 600])
  })

  it('returns an empty array when input is empty', () => {
    expect(resolveSnapPositions([], 800)).toEqual([])
  })
})

describe('viewportSnapsToPositions', () => {
  // SheetRoot semantics: fractions of VIEWPORT height, panel sized to the
  // largest snap (travel = maxSnap × viewport).
  it('maps the largest snap to 0 (fully open) and smaller ones to px offsets', () => {
    // snaps [0.4, 0.9], viewport 800 → travel 720; 0.9 → 0, 0.4 → 720 - 320.
    expect(viewportSnapsToPositions([0.4, 0.9], 800, 720)).toEqual([0, 400])
  })

  it('returns ascending positions regardless of input order', () => {
    expect(viewportSnapsToPositions([0.9, 0.25, 0.5], 800, 720)).toEqual([0, 320, 520])
  })

  it('maps the single-snap default [1] to position 0', () => {
    expect(viewportSnapsToPositions([1], 800, 800)).toEqual([0])
  })

  it('returns [] for no snaps and 0s for unmeasured travel', () => {
    expect(viewportSnapsToPositions([], 800, 720)).toEqual([])
    expect(viewportSnapsToPositions([0.4, 0.9], 800, 0)).toEqual([0, 0])
  })
})

describe('progressFor', () => {
  it('returns 1 at position 0 (fully open), 0 at travel (closed)', () => {
    expect(progressFor(0, 800)).toBe(1)
    expect(progressFor(800, 800)).toBe(0)
  })

  it('returns a linear interpolation in between', () => {
    expect(progressFor(400, 800)).toBe(0.5)
    expect(progressFor(80, 800)).toBeCloseTo(0.9, 5)
  })

  it('clamps to [0, 1] for out-of-range positions', () => {
    expect(progressFor(-100, 800)).toBe(1)
    expect(progressFor(2000, 800)).toBe(0)
  })

  it('returns 0 for non-positive travel', () => {
    expect(progressFor(50, 0)).toBe(0)
  })
})

describe('pickRelease', () => {
  const snapPositions = [80, 480] // 0.9 and 0.4 fractions of an 800px sheet
  const baseOpts = {
    snapPositions,
    enableDragToClose: true,
    velocityThreshold: 400,
    dismissVelocity: 600,
    dismissThreshold: 80,
  }

  it('snaps to the nearest snap on a slow release near a snap', () => {
    const result = pickRelease(90, 0, baseOpts)
    expect(result).toEqual({ snapIndex: 0, targetPosition: 80, dismiss: false })
  })

  it('uses projection to bias toward the direction of fling', () => {
    // Releasing midway between snaps with downward velocity should land
    // on the more-closed snap thanks to the coast. Velocity 500 px/s sits
    // above velocityThreshold (400) but below dismissVelocity (600), so
    // we stay in the "settle" path. Coast = (500 * 100)/1000 = 50 px →
    // projected = 330. Distance to 80 is 250; to 480 is 150 → snap to 480.
    const result = pickRelease(280, 500, baseOpts)
    expect(result.dismiss).toBe(false)
    expect(result.snapIndex).toBe(1)
    expect(result.targetPosition).toBe(480)
  })

  it('dismisses on a hard fling past dismissVelocity', () => {
    const result = pickRelease(400, 700, baseOpts) // velocity > 600
    expect(result.dismiss).toBe(true)
    expect(result.snapIndex).toBe(-1)
  })

  it('dismisses when projected position lands past most-closed + threshold', () => {
    // Position 500 + (300 px/s * 0.1s) = 530. mostClosed=480, threshold=80 → 560.
    // 530 < 560 so no dismiss here; need a position closer to threshold.
    // Position 550, velocity 200: 550 + 20 = 570 > 560 → dismiss.
    const result = pickRelease(550, 200, baseOpts)
    expect(result.dismiss).toBe(true)
  })

  it('dismisses on mouse-style drag past most-closed without fling', () => {
    // 500 - 480 = 20 px past, velocity ~0 (not pulling back) → dismiss.
    const result = pickRelease(500, 0, baseOpts)
    expect(result.dismiss).toBe(true)
  })

  it('does NOT dismiss when the user pulls back hard', () => {
    // Past most-closed but yanked back at high upward velocity (negative).
    const result = pickRelease(500, -400, baseOpts)
    expect(result.dismiss).toBe(false)
  })

  it('does not dismiss when enableDragToClose is false, even past threshold', () => {
    const result = pickRelease(600, 700, { ...baseOpts, enableDragToClose: false })
    expect(result.dismiss).toBe(false)
  })

  it('returns dismiss:false with snapIndex -1 when there are no snaps', () => {
    const result = pickRelease(100, 0, { ...baseOpts, snapPositions: [] })
    expect(result).toEqual({ snapIndex: -1, targetPosition: 100, dismiss: false })
  })
})

describe('useSheetBehavior (reactive wrapper)', () => {
  it('reacts to direction changes', () => {
    const direction = ref<'top' | 'bottom' | 'left' | 'right'>('bottom')
    const { axis, closeSign } = useSheetBehavior({
      direction,
      snapPoints: [1],
      travel: 800,
      velocityThreshold: 400,
      dismissVelocity: 600,
      dismissThreshold: 80,
      enableDragToClose: true,
    })
    expect(axis.value).toBe('y')
    expect(closeSign.value).toBe(1)

    direction.value = 'left'
    expect(axis.value).toBe('x')
    expect(closeSign.value).toBe(-1)
  })

  it('reacts to snap point + travel changes', () => {
    const travel = ref(800)
    const { snapPositions } = useSheetBehavior({
      direction: 'bottom',
      snapPoints: [0.5, 0.9],
      travel,
      velocityThreshold: 400,
      dismissVelocity: 600,
      dismissThreshold: 80,
      enableDragToClose: true,
    })
    expect(snapPositions.value[0]).toBeCloseTo(80, 5)
    expect(snapPositions.value[1]).toBe(400)

    travel.value = 1000
    expect(snapPositions.value[0]).toBeCloseTo(100, 5)
    expect(snapPositions.value[1]).toBe(500)
  })

  it('exposes progressFor + pickRelease bound to the current options', () => {
    const { progressFor, pickRelease } = useSheetBehavior({
      direction: 'bottom',
      snapPoints: [1],
      travel: 800,
      velocityThreshold: 400,
      dismissVelocity: 600,
      dismissThreshold: 80,
      enableDragToClose: true,
    })
    expect(progressFor(0)).toBe(1)
    expect(progressFor(800)).toBe(0)

    const result = pickRelease(0, 0)
    expect(result.dismiss).toBe(false)
    expect(result.snapIndex).toBe(0)
  })
})
