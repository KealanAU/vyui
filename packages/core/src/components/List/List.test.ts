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

// Regression — `scrollIntoId` threw on Lynx web and scrolled nowhere.
//
// The worklet reached for `lynx.querySelector('#id')` three times. That global
// selector API exists only on the NATIVE main thread; web-core's MT `lynx`
// object has no `querySelector`, so the first call raised a TypeError and took
// the whole worklet with it — the same class of failure that stranded the
// Slider on `__QuerySelectorAll`, and the one ScrollView already documents
// above its own element refs.
//
// Two of the three lookups were for the `<list>` itself, which the component
// owns and can hold a `main-thread-ref` to. The third targets an arbitrary
// consumer-owned child, so the global selector is the only route and it has to
// be feature-checked instead.
describe('List — scrollIntoId must survive a selector-less main thread', () => {
  async function readSfc(name: string): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    return fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), name), 'utf8')
  }
  function body(sfc: string, fn: string): string {
    return sfc.match(new RegExp(`function ${fn}[\\s\\S]*?\\n}`))?.[0] ?? ''
  }

  it('drives the list through a main-thread ref, not a selector', async () => {
    const sfc = await readSfc('List.vue')
    const fn = body(sfc, 'scrollIntoIdMT')
    expect(fn).toMatch(/'main thread'/)
    // Steps 1 and 3 both go through the ref'd element.
    expect(fn.match(/listEl\.invoke\('scrollToPosition'/g)?.length).toBeGreaterThanOrEqual(2)
    // And the element is actually bound in the template.
    expect(sfc).toMatch(/:main-thread-ref="listElMT"/)
  })

  it('feature-checks the global selector before the child measurement', async () => {
    const fn = body(await readSfc('List.vue'), 'scrollIntoIdMT')
    // The check must be on the METHOD, not merely on `lynx` existing — the
    // object is present on web, only the selector is missing.
    expect(fn).toMatch(/typeof g\?\.lynx\?\.querySelector !== 'function'/)
    // Bare `lynx.querySelector(...)` would throw before any guard could run.
    expect(fn).not.toMatch(/(?<![.\w])lynx\.querySelector/)
  })

  it('still lands on the row when the measurement is unavailable', async () => {
    // Degrading to the step-1 landing is the whole point — a guard that just
    // returned would leave `scrollIntoId` silently doing nothing on web.
    const fn = body(await readSfc('List.vue'), 'scrollIntoIdMT')
    // `offset: extraOffset` is unique to the fallback scroll — step 3 applies
    // the measured correction as `-offset + extraOffset`.
    expect(fn).toMatch(/offset: extraOffset,/)
    expect(fn).toMatch(/offset: -offset \+ extraOffset,/)
  })
})

// Canary for a silently-dead binding form, found alongside the above.
//
// `:main-thread:bindlayoutchange` (colon) parses as an ordinary prop —
// vue-lynx only recognises the `main-thread-` prefix, so the worklet was never
// attached and `listHeightMT` / `listWidthMT` stayed 0 on EVERY platform,
// quietly breaking `alignTo: 'bottom'` and `'middle'`. Nothing warns; the
// build is green and the maths is just wrong.
describe('core — main-thread bindings must use the hyphen form', () => {
  it('has no `main-thread:` template bindings anywhere', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

    const offenders: string[] = []
    for (const entry of fs.readdirSync(root, { recursive: true, encoding: 'utf8' })) {
      if (!entry.endsWith('.vue')) continue
      const src = fs.readFileSync(path.join(root, entry), 'utf8')
      for (const line of src.split('\n')) {
        // Template bindings only — prose in comments may name the bad form.
        if (/^\s*:?main-thread:/.test(line)) offenders.push(`${entry}: ${line.trim()}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
