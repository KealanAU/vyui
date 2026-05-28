// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Regression tests for pure swiper physics. The `'main thread'` directives
// in `physics.ts` are inert string statements at runtime; no vue-lynx
// mocking is required here.
import { describe, expect, it } from 'vitest'

import {
  applyBounce,
  calcLimit,
  calcPaging,
  calcVelocity,
  customRound,
  decideSnapTarget,
  easeOutCubic,
  HORIZONTAL_CONSUME_RANGES,
  isAngleInRanges,
  pruneQueue,
  resolveAxisLock,
  rubberEffect,
} from './physics'

describe('customRound', () => {
  it('rounds below threshold down', () => {
    expect(customRound(1.4, 0.5)).toBe(1)
    expect(customRound(1.49, 0.5)).toBe(1)
  })
  it('rounds at-or-above threshold up', () => {
    expect(customRound(1.5, 0.5)).toBe(2)
    expect(customRound(1.6, 0.5)).toBe(2)
  })
  it('honors custom threshold (gospel uses 0.95 for swipeNext)', () => {
    expect(customRound(1.94, 0.95)).toBe(1)
    expect(customRound(1.96, 0.95)).toBe(2)
  })
  it('handles negatives (snap target is negative offset / fullSize)', () => {
    // -1.5 → floor=-2, decimal = -1.5 - (-2) = 0.5 → ceil=-1
    expect(customRound(-1.5, 0.5)).toBe(-1)
  })
  it('handles integers', () => {
    expect(customRound(2, 0.5)).toBe(2)
    expect(customRound(0, 0.5)).toBe(0)
  })
})

describe('rubberEffect', () => {
  it('returns 0 for zero delta or zero width', () => {
    expect(rubberEffect(0, 100)).toBe(0)
    expect(rubberEffect(50, 0)).toBe(0)
  })
  it('preserves sign', () => {
    expect(Math.sign(rubberEffect(10, 100))).toBe(1)
    expect(Math.sign(rubberEffect(-10, 100))).toBe(-1)
  })
  it('is monotonically increasing in |delta|', () => {
    const a = rubberEffect(20, 100)
    const b = rubberEffect(40, 100)
    const c = rubberEffect(80, 100)
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(b)
  })
  it('asymptotes near 1.5 * bounceWidth (capped at 2x drag)', () => {
    const huge = rubberEffect(10_000, 100)
    expect(huge).toBeCloseTo(100, 0) // 200 / (200/100 + 1) * 1.5 = 100
    expect(huge).toBeLessThanOrEqual(150)
  })
})

describe('calcLimit', () => {
  it('clamps to 0 when offset > 0 (dragged before start)', () => {
    const r = calcLimit(50, 100, 4, false)
    expect(r.offset).toBe(0)
    expect(r.reachingLimit).toBe(-1)
  })
  it('clamps to -fullSize*(count-1) past end', () => {
    const r = calcLimit(-500, 100, 4, false)
    expect(r.offset).toBe(-300)
    expect(r.reachingLimit).toBe(1)
  })
  it('passes through mid-range offsets', () => {
    const r = calcLimit(-150, 100, 4, false)
    expect(r.offset).toBe(-150)
    expect(r.reachingLimit).toBe(0)
  })
  it('never clamps in loop mode', () => {
    expect(calcLimit(99999, 100, 4, true).offset).toBe(99999)
    expect(calcLimit(-99999, 100, 4, true).offset).toBe(-99999)
    expect(calcLimit(99999, 100, 4, true).reachingLimit).toBe(0)
  })
  it('returns {0, 0} for empty data', () => {
    const r = calcLimit(123, 100, 0, false)
    expect(r.offset).toBe(0)
    expect(r.reachingLimit).toBe(0)
  })
})

describe('applyBounce', () => {
  it('clamps when bounce disabled', () => {
    expect(applyBounce(50, 100, 4, false, false, 80)).toBe(0)
    expect(applyBounce(-500, 100, 4, false, false, 80)).toBe(-300)
  })
  it('passes through mid-range either way', () => {
    expect(applyBounce(-150, 100, 4, false, true, 80)).toBe(-150)
  })
  it('applies rubber past start (positive overscroll)', () => {
    const out = applyBounce(50, 100, 4, false, true, 80)
    // limit=0, delta=50 → rubber(50,80) ≈ 50/(50/80+1)*1.5 ≈ 46.15
    expect(out).toBeGreaterThan(0)
    expect(out).toBeLessThan(50)
  })
  it('applies rubber past end (negative overscroll)', () => {
    const out = applyBounce(-500, 100, 4, false, true, 80)
    // limit=-300, delta=-200, rubber dampens
    expect(out).toBeLessThan(-300)
    expect(out).toBeGreaterThan(-500)
  })
  it('loop mode never bounces', () => {
    expect(applyBounce(50, 100, 4, true, true, 80)).toBe(50)
    expect(applyBounce(-9999, 100, 4, true, true, 80)).toBe(-9999)
  })
})

describe('calcPaging', () => {
  it('snaps a 1.4-item drag down to 1', () => {
    // offset = -140, fullSize=100 → -offset/fullSize = 1.4 → round to 1 → -100
    expect(calcPaging(-140, 100, 4, false, 0.5)).toBe(-100)
  })
  it('REGRESSION bug #6: multi-step drag past two items snaps past two items', () => {
    // 1.6-item drag → 2. Previous impl always snapped ±1 from startIdx,
    // so a fast multi-item drag without release-velocity got stuck at 1.
    expect(calcPaging(-160, 100, 4, false, 0.5)).toBe(-200)
  })
  it('honors aggressive 0.95 rounding (gospel swipeNext)', () => {
    expect(calcPaging(-194, 100, 4, false, 0.95)).toBe(-100)
    expect(calcPaging(-196, 100, 4, false, 0.95)).toBe(-200)
  })
  it('clamps when past the last index', () => {
    expect(calcPaging(-1000, 100, 4, false, 0.5)).toBe(-300)
  })
  it('clamps when before the first index', () => {
    expect(calcPaging(50, 100, 4, false, 0.5)).toBe(0)
  })
})

describe('pruneQueue', () => {
  it('drops samples older than the window', () => {
    const pos = [0, 10, 20, 30]
    const t = [100, 200, 300, 400]
    pruneQueue(pos, t, 200, 0, 500)
    // 500 - 200 = 300; drop times < 300. 100 and 200 go.
    expect(t).toEqual([300, 400])
    expect(pos).toEqual([20, 30])
  })
  it('honors minLength to keep the latest pair around', () => {
    const pos = [0, 10]
    const t = [100, 200]
    pruneQueue(pos, t, 10, 2, 5000)
    expect(t.length).toBe(2)
    expect(pos.length).toBe(2)
  })
  it('no-ops on empty queues', () => {
    const pos: number[] = []
    const t: number[] = []
    expect(() => pruneQueue(pos, t, 100, 0, 1000)).not.toThrow()
    expect(t).toEqual([])
  })
})

describe('calcVelocity', () => {
  it('returns 0 with fewer than 2 samples', () => {
    expect(calcVelocity([], [])).toBe(0)
    expect(calcVelocity([10], [100])).toBe(0)
  })
  it('returns 0 if time window collapses', () => {
    expect(calcVelocity([0, 10], [100, 100])).toBe(0)
  })
  it('positive distance → positive velocity (LTR)', () => {
    // 100px over 100ms = 1000 px/s
    expect(calcVelocity([0, 100], [0, 100])).toBe(1000)
  })
  it('negative velocity for leftward drag (LTR)', () => {
    expect(calcVelocity([100, 0], [0, 100])).toBe(-1000)
  })
  it('RTL flips sign', () => {
    expect(calcVelocity([0, 100], [0, 100], true)).toBe(-1000)
    expect(calcVelocity([100, 0], [0, 100], true)).toBe(1000)
  })
})

describe('isAngleInRanges', () => {
  it('matches a simple horizontal cone (±45°)', () => {
    expect(isAngleInRanges(0, [[-45, 45]])).toBe(true)
    expect(isAngleInRanges(44, [[-45, 45]])).toBe(true)
    expect(isAngleInRanges(46, [[-45, 45]])).toBe(false)
    expect(isAngleInRanges(-46, [[-45, 45]])).toBe(false)
  })
  it('handles the [135, 180] half (left-pointing horizontal)', () => {
    expect(isAngleInRanges(170, [[135, 180]])).toBe(true)
    expect(isAngleInRanges(-170, [[-180, -135]])).toBe(true)
  })
  it('rejects vertical motion against the horizontal default', () => {
    expect(isAngleInRanges(90, HORIZONTAL_CONSUME_RANGES)).toBe(false)
    expect(isAngleInRanges(-90, HORIZONTAL_CONSUME_RANGES)).toBe(false)
  })
  it('handles wrap-around ranges (start > end)', () => {
    // [170, -170] wraps around ±180
    expect(isAngleInRanges(175, [[170, -170]])).toBe(true)
    expect(isAngleInRanges(-175, [[170, -170]])).toBe(true)
    expect(isAngleInRanges(0, [[170, -170]])).toBe(false)
  })
})

describe('resolveAxisLock', () => {
  it('returns null when displacement is under GESTURE_THRESHOLD', () => {
    expect(resolveAxisLock(2, 2, HORIZONTAL_CONSUME_RANGES)).toBe(null)
    expect(resolveAxisLock(5, 5, HORIZONTAL_CONSUME_RANGES)).toBe(null)
  })
  it('locks horizontally when angle in range', () => {
    const r = resolveAxisLock(20, 0, HORIZONTAL_CONSUME_RANGES)
    expect(r).toEqual({ gestureLocked: true, axisLocked: false })
  })
  it('locks main-axis (rejects swipe) when angle out of range', () => {
    const r = resolveAxisLock(0, 20, HORIZONTAL_CONSUME_RANGES)
    expect(r).toEqual({ gestureLocked: true, axisLocked: true })
  })
  it('diagonal at 45° is horizontal (boundary inclusive)', () => {
    const r = resolveAxisLock(20, 20, HORIZONTAL_CONSUME_RANGES)
    expect(r?.axisLocked).toBe(false)
  })
  it('diagonal past 45° rejects', () => {
    const r = resolveAxisLock(10, 20, HORIZONTAL_CONSUME_RANGES)
    expect(r?.axisLocked).toBe(true)
  })
})

describe('decideSnapTarget', () => {
  const base = {
    fullSize: 100,
    count: 4,
    loop: false,
    threshold: 0.5,
    velocityThreshold: 300,
  }

  it('snaps to startIdx when drag < threshold and no flick', () => {
    // start at index 1 (offset=-100), drag a bit right to -80
    const target = decideSnapTarget({
      ...base, startOffset: -100, endOffset: -80, velocity: 0,
    })
    expect(target).toBe(1)
  })
  it('snaps one further when drag past threshold', () => {
    const target = decideSnapTarget({
      ...base, startOffset: -100, endOffset: -160, velocity: 0,
    })
    expect(target).toBe(2)
  })
  it('REGRESSION bug #6: multi-item drag snaps multiple items', () => {
    // start at 0, drag past two items to -240 → snap to index 2.
    // Old impl always picked startIdx ± 1 → got stuck at 1.
    const t2 = decideSnapTarget({
      ...base, startOffset: 0, endOffset: -240, velocity: 0,
    })
    expect(t2).toBe(2)
    // Past 2.5 items (with threshold=0.5 the half tips up per gospel).
    const t3 = decideSnapTarget({
      ...base, startOffset: 0, endOffset: -260, velocity: 0,
    })
    expect(t3).toBe(3)
  })
  it('velocity flick overrides a sub-threshold drag', () => {
    const target = decideSnapTarget({
      ...base, startOffset: -100, endOffset: -110, velocity: -400,
    })
    expect(target).toBe(2)
  })
  it('reverse flick overrides a forward drag', () => {
    // user dragged left (toward next) but flicked back right
    const target = decideSnapTarget({
      ...base, startOffset: -100, endOffset: -180, velocity: 500,
    })
    expect(target).toBe(0)
  })
  it('clamps at index 0', () => {
    const target = decideSnapTarget({
      ...base, startOffset: 0, endOffset: 200, velocity: 1000,
    })
    expect(target).toBe(0)
  })
  it('clamps at last index', () => {
    const target = decideSnapTarget({
      ...base, startOffset: -300, endOffset: -500, velocity: -1000,
    })
    expect(target).toBe(3)
  })
  it('loop wraps negative target', () => {
    const target = decideSnapTarget({
      ...base, loop: true, startOffset: 0, endOffset: 50, velocity: 500,
    })
    expect(target).toBe(3) // -1 wraps to count-1
  })
  it('loop wraps past last', () => {
    const target = decideSnapTarget({
      ...base, loop: true, startOffset: -300, endOffset: -400, velocity: -500,
    })
    expect(target).toBe(0) // 4 wraps to 0
  })
  it('returns 0 with empty data', () => {
    const target = decideSnapTarget({
      ...base, count: 0, startOffset: 0, endOffset: 0, velocity: 0,
    })
    expect(target).toBe(0)
  })
})

describe('easeOutCubic', () => {
  it('endpoints', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })
  it('is concave (faster than linear at the start)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
  it('monotonic', () => {
    const a = easeOutCubic(0.25)
    const b = easeOutCubic(0.5)
    const c = easeOutCubic(0.75)
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(b)
  })
})
