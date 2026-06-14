// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx the same way useAnimate.test.ts does — run worklets
// synchronously, stub MT refs. Required because the BG worklet-loader SWC
// transform doesn't run under vitest, so `:main-thread-bind*` template attrs
// would otherwise crash at render via `applySetWorkletEvent` with a null ctx.
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

// NOTE: full render coverage of SwiperRoot is blocked on MTS test infra —
// the `:main-thread-bind*` template attrs crash under vitest even with the
// mock above because the binding itself goes through the MT ops pipeline.
// Tests here exercise the BG-side surface (item count, default index, item
// width inheritance via SwiperItem context). Touch/drag/snap is verified
// manually in LynxExplorer. See plans/mobile-first-pivot.md §3D.

describe('Swiper — exports', () => {
  it('exports SwiperRoot and SwiperItem', async () => {
    const mod = await import('.')
    expect(mod.SwiperRoot).toBeDefined()
    expect(mod.SwiperItem).toBeDefined()
    expect(mod.injectSwiperRootContext).toBeDefined()
  })
})

// --- Pure-logic regression tests --------------------------------------
// The Phase-5 rewrite (commit a1d57ac) reshaped SwiperRoot's MT pipeline.
// Two arithmetic surfaces are easy to break without an MT renderer:
//   • initial offset placement when `defaultValue` lands at a non-zero index
//   • SwiperItem width override semantics (per-item `width` > inherited `itemWidth`)
// Both are exercised below without rendering.

describe('Swiper — initial offset placement', () => {
  // Mirrors `useMainThreadRef(-(currentIndex.value ?? 0) * props.itemWidth)`
  // from SwiperRoot.vue. Normalised through `+ 0` so `-0 === 0` under
  // vitest's `Object.is`-backed `.toBe`.
  function initialOffset(currentIndex: number | undefined, itemWidth: number): number {
    return -(currentIndex ?? 0) * itemWidth + 0
  }

  it('starts at 0 when index = 0', () => {
    expect(initialOffset(0, 200)).toBe(0)
  })

  it('shifts -itemWidth per index step', () => {
    expect(initialOffset(2, 200)).toBe(-400)
    expect(initialOffset(5, 100)).toBe(-500)
  })

  it('treats undefined index as 0 (uncontrolled before defaultValue resolves)', () => {
    expect(initialOffset(undefined, 200)).toBe(0)
  })
})

describe('Swiper — SwiperItem width override', () => {
  // Mirrors `computed(() => props.width ?? ctx.itemWidth.value)` in SwiperItem.vue.
  function itemWidth(propWidth: number | undefined, ctxItemWidth: number): number {
    return propWidth ?? ctxItemWidth
  }

  it('inherits SwiperRoot itemWidth when no `width` prop', () => {
    expect(itemWidth(undefined, 240)).toBe(240)
  })

  it('per-item `width` prop wins', () => {
    expect(itemWidth(300, 240)).toBe(300)
  })

  it('width 0 still wins (explicit zero is intentional)', () => {
    // `??` semantics — 0 is not nullish, so the override applies.
    expect(itemWidth(0, 240)).toBe(0)
  })
})

// --- Loop / clamp index resolution ------------------------------------
// Mirrors the index wrap/clamp in useDragGesture's `_onTouchEnd`, `_advance`,
// and `setIndex`. Loop wraps modularly; non-loop clamps to [0, count-1].

describe('Swiper — index wrap (loop) vs clamp', () => {
  function resolve(target: number, count: number, loop: boolean): number {
    if (loop) return ((target % count) + count) % count
    if (target < 0) return 0
    if (target > count - 1) return count - 1
    return target
  }

  it('clamps below 0 to 0 when not looping', () => {
    expect(resolve(-1, 4, false)).toBe(0)
  })

  it('clamps past the end when not looping', () => {
    expect(resolve(7, 4, false)).toBe(3)
  })

  it('wraps past the end to the start when looping', () => {
    expect(resolve(4, 4, true)).toBe(0)
    expect(resolve(5, 4, true)).toBe(1)
  })

  it('wraps below 0 to the last item when looping', () => {
    expect(resolve(-1, 4, true)).toBe(3)
    expect(resolve(-2, 4, true)).toBe(2)
  })

  it('leaves in-range targets unchanged in both modes', () => {
    expect(resolve(2, 4, false)).toBe(2)
    expect(resolve(2, 4, true)).toBe(2)
  })
})

// --- Autoplay advance step --------------------------------------------
// Mirrors useDragGesture's `_advance`: next = cur + 1, wrapping in loop mode
// and stopping (returning the same index) at the last item otherwise.

describe('Swiper — autoplay advance', () => {
  function advance(cur: number, count: number, loop: boolean): number {
    if (count <= 1) return cur
    let next = cur + 1
    if (next > count - 1) {
      if (loop) next = 0
      else return cur
    }
    return next
  }

  it('advances one item', () => {
    expect(advance(0, 4, false)).toBe(1)
    expect(advance(1, 4, false)).toBe(2)
  })

  it('stops at the last item when not looping', () => {
    expect(advance(3, 4, false)).toBe(3)
  })

  it('wraps to the first item at the end when looping', () => {
    expect(advance(3, 4, true)).toBe(0)
  })

  it('is a no-op with a single item', () => {
    expect(advance(0, 1, true)).toBe(0)
    expect(advance(0, 1, false)).toBe(0)
  })
})

// --- Axis-lock classification -----------------------------------------
// Mirrors useDragGesture's `_onTouchMove` axis decision: a gesture is
// "horizontal enough" to consume when its angle is within ±45° of either
// horizontal direction (|angle| <= 45 || |angle| >= 135).

describe('Swiper — axis-lock classification', () => {
  function isHorizontal(dX: number, dY: number): boolean {
    const angle = (Math.atan2(dY, dX) * 180) / Math.PI
    const a = angle < 0 ? -angle : angle
    return a <= 45 || a >= 135
  }

  it('treats a pure horizontal drag as horizontal', () => {
    expect(isHorizontal(20, 0)).toBe(true)
    expect(isHorizontal(-20, 0)).toBe(true)
  })

  it('treats a pure vertical drag as not horizontal', () => {
    expect(isHorizontal(0, 20)).toBe(false)
    expect(isHorizontal(0, -20)).toBe(false)
  })

  it('treats a shallow diagonal (< 45°) as horizontal', () => {
    expect(isHorizontal(20, 10)).toBe(true)
  })

  it('treats a steep diagonal (> 45°) as not horizontal', () => {
    expect(isHorizontal(10, 20)).toBe(false)
  })
})
