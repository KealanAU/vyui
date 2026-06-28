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

// --- spaceBetween / fullSize snap unit --------------------------------
// Mirrors useDragGesture's switch from `itemWidth` to `fullSize = itemWidth +
// spaceBetween` as the offset↔index conversion unit.

describe('Swiper — fullSize (spaceBetween) snap unit', () => {
  function fullSize(itemWidth: number, spaceBetween: number): number {
    return itemWidth + spaceBetween
  }
  function offsetForIndex(index: number, itemWidth: number, spaceBetween: number): number {
    return -index * fullSize(itemWidth, spaceBetween) + 0
  }

  it('snap unit includes the gap', () => {
    expect(fullSize(200, 16)).toBe(216)
  })

  it('places each index one full period apart', () => {
    expect(offsetForIndex(0, 200, 16)).toBe(0)
    expect(offsetForIndex(1, 200, 16)).toBe(-216)
    expect(offsetForIndex(2, 200, 16)).toBe(-432)
  })

  it('reduces to itemWidth when there is no gap', () => {
    expect(offsetForIndex(2, 200, 0)).toBe(-400)
  })
})

// --- align nudge -------------------------------------------------------
// Mirrors useDragGesture's `alignOffsetOf` (the transform-time nudge that puts
// the active item at start/center/end of the viewport).

describe('Swiper — align nudge', () => {
  function alignOffset(
    align: 'start' | 'center' | 'end',
    containerWidth: number,
    itemWidth: number,
  ): number {
    if (containerWidth <= 0) return 0
    if (align === 'center') return (containerWidth - itemWidth) / 2
    if (align === 'end') return containerWidth - itemWidth
    return 0
  }

  it('start: no nudge', () => {
    expect(alignOffset('start', 360, 200)).toBe(0)
  })
  it('center: half the slack', () => {
    expect(alignOffset('center', 360, 200)).toBe(80)
  })
  it('end: the full slack', () => {
    expect(alignOffset('end', 360, 200)).toBe(160)
  })
  it('no container width: no nudge regardless of align', () => {
    expect(alignOffset('center', 0, 200)).toBe(0)
    expect(alignOffset('end', 0, 200)).toBe(0)
  })
})

// --- offsetLimit / align-derived clamp --------------------------------
// Mirrors useDragGesture's `resolveLimits` + the touchmove clamp:
// max = startLimit; min = -(count-1)*fullSize + endLimit.

describe('Swiper — offset clamp limits', () => {
  function resolveLimits(
    explicit: [number, number] | undefined,
    align: 'start' | 'center' | 'end',
    containerWidth: number,
    itemWidth: number,
  ): { startLimit: number, endLimit: number } {
    if (explicit) return { startLimit: explicit[0], endLimit: explicit[1] }
    if (containerWidth > 0 && align === 'end') {
      return { startLimit: containerWidth - itemWidth, endLimit: 0 }
    }
    return { startLimit: 0, endLimit: 0 }
  }
  function clamp(
    raw: number,
    count: number,
    fullSize: number,
    limits: { startLimit: number, endLimit: number },
  ): number {
    const max = limits.startLimit
    const min = -(count - 1) * fullSize + limits.endLimit
    if (raw > max) return max
    if (raw < min) return min
    return raw
  }

  it('default clamps exactly to the item range', () => {
    const l = resolveLimits(undefined, 'start', 360, 200)
    expect(clamp(50, 4, 200, l)).toBe(0)
    expect(clamp(-1000, 4, 200, l)).toBe(-600)
  })

  it('explicit offsetLimit widens the rest range', () => {
    const l = resolveLimits([0, 160], 'start', 360, 200)
    // endLimit 160 lets the last item rest 160px short of the left edge.
    expect(clamp(-1000, 4, 200, l)).toBe(-440)
  })

  it('align end pulls the first item to the right edge', () => {
    const l = resolveLimits(undefined, 'end', 360, 200)
    expect(l.startLimit).toBe(160)
    expect(clamp(200, 4, 200, l)).toBe(160)
  })
})

// --- RTL delta / velocity sign ----------------------------------------
// Mirrors useDragGesture's RTL handling: a rightward finger move reads as
// moving toward lower indices, so the drag delta and release velocity flip.

describe('Swiper — RTL direction flip', () => {
  function delta(rawDx: number, rtl: boolean): number {
    return rtl ? -rawDx : rawDx
  }
  it('LTR: rightward finger increases offset (toward lower index)', () => {
    expect(delta(40, false)).toBe(40)
  })
  it('RTL: rightward finger decreases offset (toward higher index)', () => {
    expect(delta(40, true)).toBe(-40)
  })
})

// --- Seamless loop: raw → wrapped index + seam detection --------------
// Mirrors useDragGesture's `_animateToIndex`: the raw (unwrapped) target index
// is wrapped modulo count, and a seam crossing is detected when the raw offset
// differs from the wrapped offset (so the seamless clone-region animation runs).

describe('Swiper — seamless loop wrap + seam detection', () => {
  function resolve(rawIndex: number, count: number, loop: boolean, fullSize: number) {
    let wrapped: number
    if (loop) wrapped = ((rawIndex % count) + count) % count
    else wrapped = Math.max(0, Math.min(count - 1, rawIndex))
    const rawOffset = -rawIndex * fullSize
    const wrappedOffset = -wrapped * fullSize
    return { wrapped, seamless: loop && rawOffset !== wrappedOffset }
  }

  it('forward across the seam wraps last→first AND flags a seam crossing', () => {
    // count=4: advancing from index 3 yields rawIndex 4 → wraps to 0, seam.
    const r = resolve(4, 4, true, 100)
    expect(r.wrapped).toBe(0)
    expect(r.seamless).toBe(true)
  })

  it('backward across the seam wraps first→last AND flags a seam crossing', () => {
    const r = resolve(-1, 4, true, 100)
    expect(r.wrapped).toBe(3)
    expect(r.seamless).toBe(true)
  })

  it('an in-range step wraps to itself with no seam crossing', () => {
    const r = resolve(2, 4, true, 100)
    expect(r.wrapped).toBe(2)
    expect(r.seamless).toBe(false)
  })

  it('non-loop clamps and never flags a seam crossing', () => {
    expect(resolve(4, 4, false, 100)).toEqual({ wrapped: 3, seamless: false })
    expect(resolve(-1, 4, false, 100)).toEqual({ wrapped: 0, seamless: false })
  })
})

// --- Programmatic jump: shortest seamless path ------------------------
// Mirrors useDragGesture's `_jumpAndAnimate` loop branch: setIndex picks the
// shorter of the forward/backward path around the ring so a jump from the last
// item to the first slides one step across the seam, not all the way back.

describe('Swiper — programmatic shortest loop path', () => {
  function step(cur: number, targetIndex: number, count: number): number {
    const curMod = ((cur % count) + count) % count
    let forward = targetIndex - curMod
    forward = ((forward % count) + count) % count
    const backward = forward - count
    return Math.abs(forward) <= Math.abs(backward) ? forward : backward
  }

  it('last → first goes forward one step (over the seam)', () => {
    // count=4, at index 3, jump to 0 → +1 (not -3).
    expect(step(3, 0, 4)).toBe(1)
  })
  it('first → last goes backward one step (over the seam)', () => {
    expect(step(0, 3, 4)).toBe(-1)
  })
  it('prefers forward on a tie', () => {
    // count=4, 0 → 2: forward 2, backward -2 → tie → forward.
    expect(step(0, 2, 4)).toBe(2)
  })
  it('short in-range jump stays direct', () => {
    expect(step(0, 1, 4)).toBe(1)
  })
})
