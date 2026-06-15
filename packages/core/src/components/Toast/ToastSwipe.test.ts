// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx the same way Swiper / Sheet / SwipeAction tests do, so the
// component module imports without a real MT runtime.
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

describe('ToastSwipe — exports', () => {
  it('exports ToastSwipe + decideDismiss', async () => {
    const mod = await import('.')
    expect(mod.ToastSwipe).toBeDefined()
    expect(typeof mod.decideDismiss).toBe('function')
  })
})

// The release decision the touchend worklet runs. Tested here so the
// distance / velocity / direction policy is regression-locked without an MT
// runtime. Mirrors the inline body of `_onTouchEnd`.
describe('ToastSwipe — decideDismiss', () => {
  const base = {
    width: 320,
    threshold: 0.45,
    velocityThreshold: 600,
    direction: 'horizontal' as 'horizontal' | 'left' | 'right',
  }

  async function decide(o: Partial<typeof base> & { endX: number, velocity: number }) {
    const { decideDismiss } = await import('.')
    return decideDismiss({ ...base, ...o })
  }

  it('keeps the toast when drag is short and slow', async () => {
    expect(await decide({ endX: -40, velocity: -100 })).toBe(false)
  })

  it('dismisses once dragged past the distance threshold', async () => {
    // 0.45 * 320 = 144; -160 passes it.
    expect(await decide({ endX: -160, velocity: 0 })).toBe(true)
  })

  it('dismisses on a fast flick before the distance threshold', async () => {
    expect(await decide({ endX: -30, velocity: -800 })).toBe(true)
  })

  it('dismisses either direction when horizontal', async () => {
    expect(await decide({ endX: 160, velocity: 0 })).toBe(true)
    expect(await decide({ endX: -160, velocity: 0 })).toBe(true)
  })

  it('ignores wrong-direction motion when constrained to left', async () => {
    expect(await decide({ endX: 200, velocity: 0, direction: 'left' })).toBe(false)
    expect(await decide({ endX: -200, velocity: 0, direction: 'left' })).toBe(true)
  })

  it('cannot dismiss on distance alone before width is measured', async () => {
    expect(await decide({ endX: -999, velocity: 0, width: 0 })).toBe(false)
    // …but a flick still works without a known width.
    expect(await decide({ endX: -10, velocity: -800, width: 0 })).toBe(true)
  })
})
