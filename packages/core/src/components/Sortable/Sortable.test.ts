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

describe.skip('Sortable — render (blocked on MTS test infra)', () => {
  it('renders one row per item', async () => {
    const { render, waitForUpdate } = await import('@vyui/testing-utils')
    const Sortable = (await import('./story/_Sortable.vue')).default
    const { container } = render(Sortable, {})
    await waitForUpdate()
    expect(container.querySelector('[data-testid="row-a"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="row-b"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="row-c"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="row-d"]')).not.toBeNull()
  })
})
