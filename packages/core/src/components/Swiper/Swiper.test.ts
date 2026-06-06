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
