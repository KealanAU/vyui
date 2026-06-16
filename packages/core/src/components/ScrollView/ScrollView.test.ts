// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Full render coverage of ScrollView is blocked on MTS test infra — the
// native `<scroll-view>` intrinsic, exposure events, and `'main thread'`
// worklet registration don't have a vitest/jsdom equivalent. Manual
// verification of the bounce gesture runs in LynxExplorer. See
// plans/mobile-first-pivot.md §3D.
//
// What IS tested here: the component exports, and the pure bounce decision
// maths the inline worklets call (ported into `@/shared/composables`). This
// mirrors how SwipeAction regression-tests its `decide()` logic without
// rendering.

import { describe, expect, it, vi } from 'vitest'

import {
  BOUNCE_CONSTANTS,
  BOUNCING_STATUS,
  getBouncingStatus,
  isOverTriggerDistance,
  rubberBandingDistance,
  shouldBounceWhenTouchEnd,
} from '@/shared/composables'

// Mock vue-lynx the same way Swiper / Sheet / Draggable tests do so the SFC
// imports resolve under vitest.
vi.mock('vue-lynx', async () => {
  const actual = await vi.importActual<typeof import('vue-lynx')>('vue-lynx')
  return {
    ...actual,
    runOnMainThread: (fn: (...args: any[]) => any) =>
      (...args: any[]) => Promise.resolve(fn(...args)),
    runOnBackground: (fn: (...args: any[]) => any) =>
      (...args: any[]) => { fn(...args) },
    useMainThreadRef: <T>(init: T) => ({ current: init }),
  }
})

describe('ScrollView — exports', () => {
  it('exports ScrollView', async () => {
    const mod = await import('.')
    expect(mod.ScrollView).toBeDefined()
  })
})

describe('useBounce — getBouncingStatus', () => {
  const base = { toUpper: false, toLower: false, alwaysBouncing: true }

  it('is upper-bouncing when offset is positive', () => {
    expect(getBouncingStatus({ ...base, currentOffset: 5 })).toBe(
      BOUNCING_STATUS.upperBouncing,
    )
  })

  it('is lower-bouncing when offset is negative', () => {
    expect(getBouncingStatus({ ...base, currentOffset: -5 })).toBe(
      BOUNCING_STATUS.lowerBouncing,
    )
  })

  it('is in-range at rest', () => {
    expect(getBouncingStatus({ ...base, currentOffset: 0 })).toBe(
      BOUNCING_STATUS.inScrollingRange,
    )
  })

  it('content smaller than viewport → alwaysBouncing when enabled', () => {
    expect(
      getBouncingStatus({ currentOffset: 0, toUpper: true, toLower: true, alwaysBouncing: true }),
    ).toBe(BOUNCING_STATUS.alwaysBouncing)
  })

  it('content smaller than viewport → noBouncing when disabled', () => {
    expect(
      getBouncingStatus({ currentOffset: 0, toUpper: true, toLower: true, alwaysBouncing: false }),
    ).toBe(BOUNCING_STATUS.noBouncing)
  })
})

describe('useBounce — shouldBounceWhenTouchEnd', () => {
  it('bounces back from an upper/lower overscroll', () => {
    expect(shouldBounceWhenTouchEnd(BOUNCING_STATUS.upperBouncing, true)).toBe(true)
    expect(shouldBounceWhenTouchEnd(BOUNCING_STATUS.lowerBouncing, true)).toBe(true)
  })

  it('does nothing when at rest', () => {
    expect(shouldBounceWhenTouchEnd(BOUNCING_STATUS.inScrollingRange, true)).toBe(false)
    expect(shouldBounceWhenTouchEnd(BOUNCING_STATUS.noBouncing, true)).toBe(false)
  })

  it('alwaysBouncing status honours the flag', () => {
    expect(shouldBounceWhenTouchEnd(BOUNCING_STATUS.alwaysBouncing, true)).toBe(true)
    expect(shouldBounceWhenTouchEnd(BOUNCING_STATUS.alwaysBouncing, false)).toBe(false)
  })
})

describe('useBounce — rubberBandingDistance', () => {
  it('is zero at zero delta', () => {
    expect(rubberBandingDistance(800, 0)).toBe(0)
  })

  it('is monotonic and damped (output grows slower than input)', () => {
    const frame = 800
    const small = rubberBandingDistance(frame, 100)
    const large = rubberBandingDistance(frame, 400)
    expect(large).toBeGreaterThan(small)
    // Rubber-band: displacement is always less than the raw drag.
    expect(small).toBeLessThan(100)
    expect(large).toBeLessThan(400)
  })

  it('asymptotically approaches the frame size, never exceeding it', () => {
    const frame = 800
    expect(rubberBandingDistance(frame, 1_000_000)).toBeLessThan(frame)
    expect(rubberBandingDistance(frame, 1_000_000)).toBeGreaterThan(frame * 0.9)
  })

  it('honours a stiffer rubberC (smaller = less travel)', () => {
    const stiff = rubberBandingDistance(800, 200, 0.2)
    const soft = rubberBandingDistance(800, 200, BOUNCE_CONSTANTS.rubberC)
    expect(stiff).toBeLessThan(soft)
  })
})

describe('useBounce — isOverTriggerDistance', () => {
  const pixelRatio = 2

  it('upper: fires once past startBounceTriggerDistance', () => {
    expect(
      isOverTriggerDistance({
        bouncingOffset: 60,
        startBounceTriggerDistance: 50,
        endBounceTriggerDistance: 50,
        pixelRatio,
      }),
    ).toBe(true)
    expect(
      isOverTriggerDistance({
        bouncingOffset: 40,
        startBounceTriggerDistance: 50,
        endBounceTriggerDistance: 50,
        pixelRatio,
      }),
    ).toBe(false)
  })

  it('lower: uses endBounceTriggerDistance for negative offsets', () => {
    expect(
      isOverTriggerDistance({
        bouncingOffset: -90,
        startBounceTriggerDistance: 999,
        endBounceTriggerDistance: 50,
        pixelRatio,
      }),
    ).toBe(true)
  })

  it('zero trigger distance fires on any real overscroll', () => {
    expect(
      isOverTriggerDistance({
        bouncingOffset: 5,
        startBounceTriggerDistance: 0,
        endBounceTriggerDistance: 0,
        pixelRatio,
      }),
    ).toBe(true)
  })
})
