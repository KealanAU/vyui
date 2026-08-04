// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx the same way Swiper / Sheet / Draggable tests do.
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

describe('SwipeAction — exports', () => {
  it('exports SwipeAction default', async () => {
    const mod = await import('.')
    expect(mod.SwipeAction).toBeDefined()
  })
})

// The release decision itself (`decideSwipeAction`) and the ±45° axis cone
// (`resolveAxisLock`) are unit-tested against the real implementations in
// `shared/gesture/physics.test.ts`. Worklets can't call across files, so
// `_dragEnd` / `_dragMove` carry hand-copied mirrors plus the parts physics.ts
// cannot see: the order the branches are tested in, where each one settles the
// row, and what it emits.
describe('SwipeAction — release contract in the SFC source', () => {
  async function readSfc(name: string): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    return fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), name), 'utf8')
  }

  function body(sfc: string, fn: string): string {
    return sfc.match(new RegExp(`function ${fn}[\\s\\S]*?\\n}`))?.[0] ?? ''
  }

  it('decides commit, then a closing flick, then open — in that order', async () => {
    // Order is the contract: a hard leftward flick has to beat the open
    // threshold, and a rightward flick has to beat the position check, or a
    // fast flick out of a deep drag resolves to the wrong outcome.
    const fn = body(await readSfc('SwipeAction.vue'), '_dragEnd')
    const commit = fn.indexOf('opening >= commitVelocityRef.current')
    const closeFlick = fn.indexOf('velocity >= velocityThresholdRef.current')
    const open = fn.indexOf('opening >= velocityThresholdRef.current')
    expect(commit).toBeGreaterThan(-1)
    expect(closeFlick).toBeGreaterThan(commit)
    expect(open).toBeGreaterThan(closeFlick)
  })

  it('settles each branch to its own resting position', async () => {
    // commit → off the row entirely, closing flick → closed, open → the action
    // panel width, fallthrough → closed.
    const fn = body(await readSfc('SwipeAction.vue'), '_dragEnd')
    expect([...fn.matchAll(/_animateTo\((.*?)\)/g)].map(m => m[1]))
      .toEqual(['-rw', '0', '-aw', '0'])
  })

  it('emits commit once and otherwise reports the new open state', async () => {
    const fn = body(await readSfc('SwipeAction.vue'), '_dragEnd')
    const emitted = [...fn.matchAll(/runOnBackground\((_emit\w+) as any\)\((\w*)\)/g)]
      .map(m => `${m[1]}(${m[2]})`)
    expect(emitted).toEqual([
      '_emitCommit()',
      '_emitOpen(false)',
      '_emitOpen(true)',
      '_emitOpen(false)',
    ])
  })

  it('yields the whole gesture to a vertical scroll once axis-locked', async () => {
    // The lock is resolved once per gesture and stays sticky, and release is a
    // no-op for a yielded gesture — snapping there would fight the list scroll.
    const sfc = await readSfc('SwipeAction.vue')
    expect(body(sfc, '_dragMove')).toMatch(/if \(axisLockRef\.current === 2\) return/)
    expect(body(sfc, '_dragEnd')).toMatch(/if \(axisLockRef\.current === 2\) \{[\s\S]*?return/)
  })
})
