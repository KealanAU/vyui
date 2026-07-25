// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Cross-surface guard for the desktop-mouse drag rollout.
//
// Lynx web dispatches raw mouse events and never synthesizes touch from them,
// so every draggable surface carries mouse twins beside its touch handlers.
// Seven surfaces implement the same wrapper rules independently — worklets
// can't call across files, so the pattern is copied by hand and drifts by
// hand. None of it is reachable at runtime here (`'main thread'` worklets bound
// through `:main-thread-bind*` crash the vitest renderer), so the contract is
// asserted against the SFC sources, the way FeedList's PTR and Slider's
// worklet invariants are.
//
// The behaviour these rules encode is exercised for real in
// `useDragGesture.test.ts`, which CAN run its worklets — treat that file as
// the spec and this one as the drift alarm for the copies.
import { describe, expect, it } from 'vitest'

async function readSfc(relPath: string): Promise<string> {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const here = path.dirname(new URL(import.meta.url).pathname)
  return fs.readFileSync(path.join(here, '../../components', relPath), 'utf8')
}

function body(sfc: string, fn: string): string {
  return sfc.match(new RegExp(`function ${fn}[\\s\\S]*?\\n}`))?.[0] ?? ''
}

/** Surfaces that implement their own mouse wrappers over a shared drag core. */
const OWN_WRAPPERS = [
  'Draggable/Draggable.vue',
  'Sortable/SortableItem.vue',
  'SwipeAction/SwipeAction.vue',
  'Toast/ToastSwipe.vue',
  'Sheet/SheetContentImpl.vue',
]

/** Surfaces that bind handlers sourced elsewhere (composable / injected ctx). */
const BINDINGS_ONLY = [
  'Swiper/SwiperRoot.vue', // useDragGesture
  'Sheet/SheetHandle.vue', // injected SheetDragContext
  'Slider/SliderImplMTS.vue', // own wrappers, covered in Slider.test.ts
]

describe('desktop mouse drag — event bindings', () => {
  for (const file of [...OWN_WRAPPERS, ...BINDINGS_ONLY]) {
    it(`${file} binds mousedown/mousemove/mouseup beside its touch handlers`, async () => {
      const sfc = await readSfc(file)
      // Hyphenated, not camelCase: Lynx only dispatches the hyphen spelling
      // through `:main-thread-bind*`, and a camelCase attr fails silently.
      for (const evt of ['mousedown', 'mousemove', 'mouseup'])
        expect(sfc, `${file} :main-thread-bind${evt}`).toMatch(`:main-thread-bind${evt}=`)
      expect(sfc, `${file} still binds touch`).toMatch(':main-thread-bindtouchstart=')
    })

    it(`${file} does not bind mouseleave`, async () => {
      // mouseleave doesn't bubble, so per-element delivery is unreliable on
      // the Lynx dispatch path — an end-on-leave binding drops drags at
      // random. The buttons check in mousemove recovers the lost release
      // instead. (The word itself appears in each file's comment saying so.)
      expect(await readSfc(file), file).not.toMatch(/bindmouse(leave|out)=/i)
    })
  }
})

describe('desktop mouse drag — wrapper rules', () => {
  for (const file of OWN_WRAPPERS) {
    it(`${file} swallows the compatibility mousedown replayed after a tap`, async () => {
      // Touch browsers replay a tap as a mousedown/mouseup pair after
      // touchend. Without the window, one tap runs the gesture twice.
      const sfc = await readSfc(file)
      expect(body(sfc, '_onMouseDown'), file)
        .toMatch(/Date\.now\(\) - lastTouchTsRef\.current < 500/)
      const stamps = ['_onTouchEnd', '_onTouchCancel']
        .map(fn => body(sfc, fn))
        .filter(Boolean)
      expect(stamps.length, `${file} defines a touch-end handler`).toBeGreaterThan(0)
      for (const fn of stamps)
        expect(fn, file).toMatch(/lastTouchTsRef\.current = Date\.now\(\)/)
    })

    it(`${file} arms only on the primary button`, async () => {
      // A right/middle press that armed the drag would be "released" by the
      // next hover move, teleporting the element.
      expect(body(await readSfc(file), '_onMouseDown'), file)
        .toMatch(/typeof e\.buttons === 'number' && \(e\.buttons & 1\) === 0\) return/)
    })

    it(`${file} treats only an EXPLICIT buttons value as a release`, async () => {
      // Recovers a mouseup lost outside the <lynx-view>, without ending the
      // drag on trackpad/synthetic moves that omit `buttons` entirely — a
      // truthiness check there lets go of the element mid-gesture.
      const fn = body(await readSfc(file), '_onMouseMove')
      expect(fn, file).toMatch(/typeof e\.buttons === 'number' && \(e\.buttons & 1\) === 0/)
      expect(fn, `${file} must not treat a missing buttons as released`)
        .not.toMatch(/if \(!e\.buttons\)|e\.buttons === 0\b/)
    })

    it(`${file} reads mouse coordinates top-level, never from detail`, async () => {
      // Mouse `detail` is the DOM click-count number, not `{x, y}` — reading
      // it yields undefined coords and a drag that never moves.
      const sfc = await readSfc(file)
      for (const fn of ['_onMouseDown', '_onMouseMove']) {
        const src = body(sfc, fn)
        expect(src, `${file} ${fn}`).toMatch(/e\.client[XY]/)
        expect(src, `${file} ${fn} must not read e.detail`).not.toMatch(/e\.detail/)
      }
    })

    it(`${file} feeds touch and mouse through the same coordinate core`, async () => {
      // The whole point of the rollout: one gesture implementation, two
      // wrappers. A mouse path that reimplements the physics drifts.
      const sfc = await readSfc(file)
      const cores = [
        '_dragStart', '_dragMove', '_dragEnd',
        '_gestureStart', '_gestureMove', '_gestureEnd',
      ].filter(name => body(sfc, name))
      expect(cores.length, `${file} defines shared gesture cores`).toBeGreaterThan(0)
      const called = (fn: string) => cores.some(core => body(sfc, fn).includes(`${core}(`))
      for (const fn of ['_onMouseDown', '_onMouseMove', '_onTouchStart', '_onTouchMove'])
        expect(called(fn), `${file} ${fn} calls a shared core`).toBe(true)
    })
  }
})
