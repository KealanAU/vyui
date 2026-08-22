// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx to run worklets synchronously and stub MT refs. Required
// because the BG worklet-loader SWC transform doesn't run under vitest, so
// `:main-thread-bind*` template attrs would otherwise crash at render via
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

// NOTE: full render coverage of SwiperRoot is blocked on MTS test infra —
// the `:main-thread-bind*` template attrs crash under vitest even with the
// mock above because the binding itself goes through the MT ops pipeline.
//
// Drag, snap, clamp, loop wrap, RTL, the align nudge, axis lock and the
// release physics all run for real in `shared/gesture/useDragGesture.test.ts`
// (which drives the actual composable) and `shared/gesture/physics.test.ts`.
// Treat those as the spec. What is left here is the wiring Swiper alone owns
// and cannot execute, asserted against source text the way
// mouseDragContract.test.ts and Slider.test.ts do it.

describe('Swiper — exports', () => {
  it('exports SwiperRoot and SwiperItem', async () => {
    const mod = await import('.')
    expect(mod.SwiperRoot).toBeDefined()
    expect(mod.SwiperItem).toBeDefined()
    expect(mod.injectSwiperRootContext).toBeDefined()
  })
})

async function readSource(relPath: string): Promise<string> {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const here = path.dirname(new URL(import.meta.url).pathname)
  return fs.readFileSync(path.join(here, relPath), 'utf8')
}

const CONTROLLER = '../../shared/gesture/useDragGesture.ts'

describe('Swiper — resting offset placement', () => {
  it('places the initial transform at -index * (itemWidth + spaceBetween)', async () => {
    // The snap unit is the item PLUS the gap. Using itemWidth alone drifts the
    // track by one gap per index — invisible until a device run, because the
    // offset is dispatched once at mount and never re-derived.
    const src = await readSource(CONTROLLER)
    expect(src).toMatch(/fullSizeOf = \(\) => config\.itemWidth\(\) \+ spaceBetweenGetter\(\)/)
    expect(src).toMatch(/const initialOffset = -\(currentIndex\.value \?\? 0\) \* fullSizeOf\(\)/)
  })

  it('dispatches that transform unless the resting position is already translateX(0)', async () => {
    // An align nudge or RTL still needs the dispatch at index 0; skipping it
    // there leaves the first item parked at the wrong edge.
    const src = await readSource(CONTROLLER)
    expect(src).toMatch(/if \(initialOffset !== 0 \|\| alignOffsetOf\(\) !== 0 \|\| rtlGetter\(\)\)/)
  })
})

describe('SwiperItem — width override', () => {
  it('takes the per-item `width` prop over the inherited itemWidth, including 0', async () => {
    // `??`, not `||`: an explicit 0 is a real width and `||` would silently
    // fall back to the root's itemWidth.
    const sfc = await readSource('SwiperItem.vue')
    expect(sfc).toMatch(/computed\(\(\) => props\.width \?\? ctx\.itemWidth\.value\)/)
    expect(sfc).toMatch(/width: `\$\{width\.value\}px`/)
  })

  it('carries the gap as a margin, never folded into the item width', async () => {
    // Folding the gap into `width` would double-count it: the controller
    // already adds spaceBetween to the snap unit.
    const sfc = await readSource('SwiperItem.vue')
    expect(sfc).toMatch(/base\.marginLeft = `\$\{gap\}px`/)
    expect(sfc).toMatch(/base\.marginRight = `\$\{gap\}px`/)
  })
})

describe('Swiper — autoplay advance', () => {
  it('steps one item, stops at the last unless looping, and never fights a drag', async () => {
    // `_advance` fires from an MT timer chain, so no runnable coverage exists
    // for it in useDragGesture.test.ts.
    const src = await readSource(CONTROLLER)
    const fn = src.match(/function _advance\(\)[\s\S]*?\n {2}\}/)?.[0] ?? ''
    expect(fn).toMatch(/if \(isDraggingRef\.current\) return/)
    expect(fn).toMatch(/if \(count <= 1\) return/)
    expect(fn).toMatch(/if \(next > count - 1 && !loopRef\.current\) return/)
    expect(fn).toMatch(/_animateToIndex\(next\)/)
  })
})
