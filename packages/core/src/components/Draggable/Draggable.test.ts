// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx the same way Swiper / Sheet tests do — run worklets
// synchronously, stub MT refs. The BG worklet-loader SWC transform doesn't
// run under vitest, so `:main-thread-bind*` attrs would otherwise crash via
// `applySetWorkletEvent` with a null ctx.
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

const { render, waitForUpdate } = await import('@vyui/testing-utils')
const Draggable = (await import('./story/_Draggable.vue')).default

// NOTE: full render coverage of Draggable is blocked on MTS test infra — the
// `:main-thread-bind*` template attrs crash under vitest even with the mock
// above. Touch / drag / velocity is verified manually in LynxExplorer. See
// `plans/mobile-first-pivot.md` §3D and `plans/mts-test-infra-spike.md`.

describe('Draggable — exports', () => {
  it('exports Draggable as default and named types', async () => {
    const mod = await import('.')
    expect(mod.Draggable).toBeDefined()
  })
})

describe.skip('Draggable — render (blocked on MTS test infra)', () => {
  it('renders a handle with initial dragging=false', async () => {
    const { container } = render(Draggable, {})
    await waitForUpdate()
    const dragging = container.querySelector('[data-testid="dragging"]') as HTMLElement | null
    expect(dragging?.textContent).toBe('no')
  })
})
