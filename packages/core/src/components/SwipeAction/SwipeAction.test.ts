// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx the same way Swiper / Sheet / Draggable tests do.
import { describe, expect, it, vi } from 'vitest'

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

describe('SwipeAction — exports', () => {
  it('exports SwipeAction default', async () => {
    const mod = await import('.')
    expect(mod.SwipeAction).toBeDefined()
  })
})

// Pure logic the touchend worklet runs. Kept here so the snap / commit
// decision is regression-tested without rendering. Mirrors the body of
// `_onTouchEnd` in SwipeAction.vue.
describe('SwipeAction — release-snap decision', () => {
  type Decision = 'commit' | 'open' | 'close'

  function decide(opts: {
    endX: number
    velocity: number
    actionWidth: number
    rowWidth: number
    snapThreshold: number
    commitThreshold: number
    commitVelocity: number
    velocityThreshold: number
  }): Decision {
    if (-opts.velocity >= opts.commitVelocity || -opts.endX >= opts.commitThreshold * opts.rowWidth) {
      return 'commit'
    }
    if (-opts.velocity >= opts.velocityThreshold || -opts.endX >= opts.snapThreshold * opts.actionWidth) {
      return 'open'
    }
    return 'close'
  }

  const base = {
    actionWidth: 80,
    rowWidth: 320,
    snapThreshold: 0.5,
    commitThreshold: 0.5,
    commitVelocity: 1200,
    velocityThreshold: 400,
  }

  it('closes when drag did not pass snap threshold and velocity is mild', () => {
    expect(decide({ ...base, endX: -10, velocity: -50 })).toBe('close')
  })

  it('opens when drag passes snap threshold', () => {
    // -endX = 50, snap threshold = 0.5 * 80 = 40 → open.
    expect(decide({ ...base, endX: -50, velocity: 0 })).toBe('open')
  })

  it('opens on mild leftward flick even before snap threshold', () => {
    expect(decide({ ...base, endX: -20, velocity: -500 })).toBe('open')
  })

  it('commits when dragged past commit threshold (half row width)', () => {
    // -endX = 200, commit threshold = 0.5 * 320 = 160 → commit.
    expect(decide({ ...base, endX: -200, velocity: 0 })).toBe('commit')
  })

  it('commits on hard leftward flick regardless of position', () => {
    expect(decide({ ...base, endX: -30, velocity: -1400 })).toBe('commit')
  })
})
