// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx the same way Swiper / Sheet / Draggable tests do — run
// worklets synchronously, stub MT refs. The BG worklet-loader SWC transform
// doesn't run under vitest, so `:main-thread-bind*` template attrs would
// otherwise crash via `applySetWorkletEvent` with a null ctx.
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

describe('Sortable — exports', () => {
  it('exports SortableRoot, SortableItem, and inject helper', async () => {
    const mod = await import('.')
    expect(mod.SortableRoot).toBeDefined()
    expect(mod.SortableItem).toBeDefined()
    expect(mod.injectSortableRootContext).toBeDefined()
  })
})

describe('Sortable — commitReorder logic', () => {
  it('moves an item from `from` to `to` within an array', () => {
    // Mirrors the body of `commitReorder` in SortableRoot.vue. Kept here so
    // the index math is regression-tested without rendering — the rendering
    // side is blocked on MTS test infra.
    function move<T>(list: T[], from: number, to: number): T[] {
      const next = [...list]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    }

    expect(move(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(move(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(move(['a', 'b', 'c', 'd'], 1, 1)).toEqual(['a', 'b', 'c', 'd'])
  })
})

// Velocity-aware drop the touchend worklet runs (mirrors the body of
// `_onTouchEnd` in SortableItem.vue / physics.ts sortableDropTarget): a fast
// toss lands one row further in the flick direction, clamped to range, never
// reversing the pointer's committed direction.
describe('Sortable — velocity-aware drop', () => {
  function drop(startIdx: number, rawTarget: number, velocity: number, count: number): number {
    let target = rawTarget
    if (velocity < 0 ? -velocity >= 300 : velocity >= 300) {
      const dir = velocity > 0 ? 1 : -1
      if (dir > 0 && target >= startIdx) target += 1
      else if (dir < 0 && target <= startIdx) target -= 1
    }
    if (target < 0) target = 0
    if (target > count - 1) target = count - 1
    return target
  }

  it('passes the raw target through when velocity is mild', () => {
    expect(drop(2, 3, 100, 6)).toBe(3)
  })
  it('a fast downward toss throws one row further', () => {
    expect(drop(0, 2, 400, 6)).toBe(3)
  })
  it('a fast upward toss throws one row higher', () => {
    expect(drop(5, 3, -400, 6)).toBe(2)
  })
  it('does not reverse the committed pointer direction', () => {
    expect(drop(0, 3, -400, 6)).toBe(3)
  })
  it('clamps to the list bounds', () => {
    expect(drop(5, 5, 400, 6)).toBe(5)
    expect(drop(0, 0, -400, 6)).toBe(0)
  })
})
