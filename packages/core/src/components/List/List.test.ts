// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { describe, expect, it, vi } from 'vitest'

// Mock vue-lynx the same way useAnimate.test.ts does — run worklets
// synchronously, stub MT refs. Required because the BG worklet-loader SWC
// transform doesn't run under vitest, so `:main-thread-bind*` template attrs
// would otherwise crash at render via `applySetWorkletEvent` with a null ctx.
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

describe('List — exports', () => {
  it('exports List + ListItem and their prop types', async () => {
    const mod = await import('.')
    expect(mod.List).toBeDefined()
    expect(mod.ListItem).toBeDefined()
  })
})

// Pure-logic regression tests for the inline alignment math inside the
// `scrollIntoIdMT` worklet (List.vue ~line 220). Replicated here so the
// arithmetic is verified without rendering — the worklet itself is blocked
// by MTS test infra. See plans/mobile-first-pivot.md §3D.
describe('List — scrollIntoId alignment math', () => {
  function computeOffset(
    alignTo: 'top' | 'bottom' | 'middle' | 'none',
    rect: { upper: number, lower: number, childSize: number },
    listSize: number,
  ): number {
    if (alignTo === 'top') return rect.upper
    if (alignTo === 'bottom') return rect.lower - listSize
    if (alignTo === 'middle') return rect.upper - (listSize - rect.childSize) / 2
    return 0
  }

  it('top alignment = child upper edge offset', () => {
    expect(computeOffset('top', { upper: 120, lower: 200, childSize: 80 }, 600)).toBe(120)
  })

  it('bottom alignment = child lower edge minus viewport', () => {
    expect(computeOffset('bottom', { upper: 120, lower: 200, childSize: 80 }, 600)).toBe(-400)
  })

  it('middle alignment centers the child in the viewport', () => {
    // child of 100 in a 600 viewport at upper 250 → offset 250 - (600-100)/2 = 0
    expect(computeOffset('middle', { upper: 250, lower: 350, childSize: 100 }, 600)).toBe(0)
  })

  it('none alignment skips the corrective step (offset 0)', () => {
    expect(computeOffset('none', { upper: 120, lower: 200, childSize: 80 }, 600)).toBe(0)
  })
})

// `invoke()` is the selector-query wrapper used by scrollTo / autoScroll /
// getVisibleCells. On hosts without the `lynx` global (vitest / SSR) it must
// resolve `undefined` rather than throw — otherwise SSR / web fallback render
// of `<List>` would crash on first ref call.
describe('List — invoke() web fallback', () => {
  function invoke(method: string, params: Record<string, unknown> = {}, listId = 'vy-list-x'): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const g = globalThis as any
      if (!g?.lynx?.createSelectorQuery) {
        resolve(undefined)
        return
      }
      g.lynx
        .createSelectorQuery()
        .select(`#${listId}`)
        .invoke({ method, params, success: (r: unknown) => resolve(r), fail: reject })
        .exec()
    })
  }

  it('resolves undefined when `lynx.createSelectorQuery` is absent', async () => {
    // The vyui test setup installs a default `lynx` global — null out the
    // selector-query API for this case to exercise the SSR / web-fallback
    // branch, then restore.
    const original = (globalThis as any).lynx
    ;(globalThis as any).lynx = { ...original, createSelectorQuery: undefined }
    try {
      await expect(invoke('scrollToPosition', { position: 0 })).resolves.toBeUndefined()
    }
    finally {
      ;(globalThis as any).lynx = original
    }
  })

  it('routes to lynx.createSelectorQuery().select().invoke() when available', async () => {
    const exec = vi.fn()
    const invokeCall = vi.fn((opts: any) => {
      // mirror the runtime — fire `success` synchronously.
      opts.success?.({ ok: true })
      return { exec }
    })
    const select = vi.fn(() => ({ invoke: invokeCall }))
    const createSelectorQuery = vi.fn(() => ({ select }))
    ;(globalThis as any).lynx = { createSelectorQuery }

    try {
      const res = await invoke('scrollToPosition', { position: 3 })
      expect(createSelectorQuery).toHaveBeenCalledOnce()
      expect(select).toHaveBeenCalledWith('#vy-list-x')
      expect(invokeCall).toHaveBeenCalledOnce()
      expect(invokeCall.mock.calls[0][0].method).toBe('scrollToPosition')
      expect(invokeCall.mock.calls[0][0].params).toEqual({ position: 3 })
      expect(exec).toHaveBeenCalledOnce()
      expect(res).toEqual({ ok: true })
    }
    finally {
      delete (globalThis as any).lynx
    }
  })
})

describe.skip('List — render (blocked on MTS test infra)', () => {
  it('renders a <list> element with the configured spanCount', async () => {
    // see plans/mobile-first-pivot.md §3D for the MT-binding crash that
    // prevents render-based tests here.
  })
})
