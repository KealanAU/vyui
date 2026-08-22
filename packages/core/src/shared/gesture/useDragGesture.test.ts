// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// useDragGesture wires ~20 `useMainThreadRef` instances and a set of
// `'main thread'`-directive worklets (see the header comment in
// useDragGesture.ts). `'main thread'` is an inert string directive outside
// the real Lynx MT bundling step (confirmed by physics.test.ts, which the
// worklet math here mirrors), so under vitest the worklet functions execute
// as plain synchronous JS — the only blocker is that `useMainThreadRef`,
// `runOnMainThread`, and `runOnBackground` expect the real Lynx MT dispatch
// pipeline to be present. We mock them the same way Swiper.test.ts does (run
// worklets in-process, `useMainThreadRef` as a plain `{ current }` box), which
// makes the ACTUAL touch/drag/snap/loop implementation exercisable directly
// instead of only mirroring its math.
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

vi.mock('vue-lynx', async () => {
  const actual = await vi.importActual<typeof import('vue-lynx')>('vue-lynx')
  return {
    ...actual,
    runOnMainThread: (fn: (...args: any[]) => any) =>
      (...args: any[]) => Promise.resolve(fn(...args)),
    runOnBackground: (fn: (...args: any[]) => any) =>
      (...args: any[]) => { fn(...args) },
    useMainThreadRef: <T,>(init: T) => ({ current: init }),
  }
})

const { useDragGesture } = await import('./useDragGesture')

interface MountOpts {
  itemWidth?: number
  itemCount?: number
  duration?: number
  threshold?: number
  velocityThreshold?: number
  disabled?: boolean
  loop?: boolean
  axisLock?: boolean
  rtl?: boolean
  align?: 'start' | 'center' | 'end'
  containerWidth?: number
  spaceBetween?: number
}

// Mounts useDragGesture() inside a real component (so onMounted/watch have a
// live instance) and returns the gesture handle plus a spy on the MT
// container's setStyleProperty so the actual transform math can be asserted.
function mountGesture(opts: MountOpts = {}, currentIndex = ref(0)) {
  const onSwipeStart = vi.fn()
  const onSwipeEnd = vi.fn()
  let gesture!: ReturnType<typeof useDragGesture>

  const Comp = defineComponent({
    setup() {
      gesture = useDragGesture({
        currentIndex,
        itemWidth: () => opts.itemWidth ?? 100,
        itemCount: () => opts.itemCount ?? 4,
        spaceBetween: () => opts.spaceBetween ?? 0,
        align: () => opts.align ?? 'start',
        containerWidth: () => opts.containerWidth ?? 0,
        rtl: () => opts.rtl ?? false,
        duration: () => opts.duration ?? 0,
        threshold: () => opts.threshold ?? 0.5,
        velocityThreshold: () => opts.velocityThreshold ?? 300,
        disabled: () => opts.disabled ?? false,
        loop: () => opts.loop ?? false,
        axisLock: () => opts.axisLock ?? false,
        onSwipeStart,
        onSwipeEnd,
      })
      return () => h('view')
    },
  })

  mount(Comp)
  const setStyleProperty = vi.fn()
  gesture.containerRef.current = { setStyleProperty }

  return { gesture, currentIndex, onSwipeStart, onSwipeEnd, setStyleProperty }
}

describe('useDragGesture — exports', () => {
  it('exports the useDragGesture composable', () => {
    expect(useDragGesture).toBeTypeOf('function')
  })
})

describe('useDragGesture — public API shape', () => {
  it('exposes containerRef + touch handlers + setIndex', () => {
    const { gesture } = mountGesture()
    expect(gesture.containerRef).toBeDefined()
    expect(gesture.onTouchStart).toBeTypeOf('function')
    expect(gesture.onTouchMove).toBeTypeOf('function')
    expect(gesture.onTouchEnd).toBeTypeOf('function')
    expect(gesture.setIndex).toBeTypeOf('function')
  })
})

describe('useDragGesture — touch lifecycle', () => {
  it('onTouchStart fires onSwipeStart', () => {
    const { gesture, onSwipeStart } = mountGesture()
    gesture.onTouchStart({ detail: { x: 0, y: 0 } })
    expect(onSwipeStart).toHaveBeenCalledTimes(1)
  })

  it('ignores touch input while disabled', () => {
    const { gesture, onSwipeStart } = mountGesture({ disabled: true })
    gesture.onTouchStart({ detail: { x: 10, y: 10 } })
    expect(onSwipeStart).not.toHaveBeenCalled()
  })
})

describe('useDragGesture — drag + snap', () => {
  it('a drag below the snap threshold settles back to the start index', () => {
    const { gesture, currentIndex, onSwipeEnd, setStyleProperty } = mountGesture()
    // Time must be mocked (not left to real elapsed wall-clock time): touchstart
    // -> touchmove -> touchend run synchronously, so real elapsed time is a
    // sub-millisecond value that Date.now()'s millisecond resolution can round
    // to 0ms OR 1ms depending on exactly which tick the calls straddle. A
    // rounded-up 1ms gap turns this 30px drag into an ~30,000px/s velocity,
    // spuriously crossing velocityThreshold and flicking to index 1 instead of
    // settling back — this is what made the test flaky across machines/CI.
    // 150ms keeps velocity (200px/s) safely under the 300px/s threshold.
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1000) // touchstart sample
    gesture.onTouchStart({ detail: { x: 100, y: 0 } })
    nowSpy.mockReturnValueOnce(1150).mockReturnValueOnce(1150) // touchmove sample + internal prune
    gesture.onTouchMove({ detail: { x: 70, y: 0 } }) // 30px drag = 30% of itemWidth
    nowSpy.mockReturnValueOnce(1160) // touchend internal prune
    gesture.onTouchEnd()
    expect(currentIndex.value).toBe(0)
    expect(onSwipeEnd).toHaveBeenCalledWith(0)
    expect(setStyleProperty).toHaveBeenCalledWith('transform', 'translateX(0px)')
    nowSpy.mockRestore()
  })

  it('a drag past the snap threshold advances to the next index', () => {
    const { gesture, currentIndex, onSwipeEnd, setStyleProperty } = mountGesture()
    // Mocked for the same reason as the test above: an unmocked real-time gap
    // here happened to still land on index 1 (the un-thresholded flick-override
    // path and the intended distance-based path agree by coincidence for this
    // drag), which masked the same underlying non-determinism. Pin the timing
    // so this actually exercises the distance-based classification it names.
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1000) // touchstart sample
    gesture.onTouchStart({ detail: { x: 100, y: 0 } })
    nowSpy.mockReturnValueOnce(1300).mockReturnValueOnce(1300) // touchmove sample + internal prune
    gesture.onTouchMove({ detail: { x: 30, y: 0 } }) // 70px drag = 70% of itemWidth
    nowSpy.mockReturnValueOnce(1310) // touchend internal prune
    gesture.onTouchEnd()
    expect(currentIndex.value).toBe(1)
    expect(onSwipeEnd).toHaveBeenCalledWith(1)
    expect(setStyleProperty).toHaveBeenCalledWith('transform', 'translateX(-100px)')
    nowSpy.mockRestore()
  })

  it('clamps the drag offset at the start/end of a non-loop track', () => {
    const { gesture, setStyleProperty } = mountGesture({}, ref(3)) // last index of 4
    gesture.onTouchStart({ detail: { x: 300, y: 0 } })
    gesture.onTouchMove({ detail: { x: 50, y: 0 } }) // would overshoot past the last item
    expect(setStyleProperty).toHaveBeenCalledWith('transform', 'translateX(-300px)')
  })

  it('a fast flick advances one index even below the snap threshold', () => {
    const { gesture, currentIndex, onSwipeEnd } = mountGesture()
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1000) // touchstart sample
    gesture.onTouchStart({ detail: { x: 100, y: 0 } })
    nowSpy.mockReturnValueOnce(1050).mockReturnValueOnce(1050) // touchmove sample + internal prune
    gesture.onTouchMove({ detail: { x: 80, y: 0 } }) // only 20px drag (below threshold) but fast
    nowSpy.mockReturnValueOnce(1060) // touchend internal prune
    gesture.onTouchEnd()
    expect(currentIndex.value).toBe(1)
    expect(onSwipeEnd).toHaveBeenCalledWith(1)
    nowSpy.mockRestore()
  })

  it('a reverse flick overrides a forward drag', () => {
    const { gesture, currentIndex, onSwipeEnd } = mountGesture()
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1000)
    gesture.onTouchStart({ detail: { x: 100, y: 0 } })
    nowSpy.mockReturnValueOnce(1050).mockReturnValueOnce(1050)
    // dragged 40px forward (toward next item) but flicked back to the right fast
    gesture.onTouchMove({ detail: { x: 140, y: 0 } })
    nowSpy.mockReturnValueOnce(1060)
    gesture.onTouchEnd()
    expect(currentIndex.value).toBe(0)
    expect(onSwipeEnd).toHaveBeenCalledWith(0)
    nowSpy.mockRestore()
  })
})

describe('useDragGesture — loop mode', () => {
  it('wraps a forward flick past the last item back to index 0 (seamless seam crossing)', () => {
    const { gesture, currentIndex, onSwipeEnd } = mountGesture({ loop: true }, ref(3))
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(2000)
    gesture.onTouchStart({ detail: { x: 300, y: 0 } })
    nowSpy.mockReturnValueOnce(2050).mockReturnValueOnce(2050)
    gesture.onTouchMove({ detail: { x: 280, y: 0 } }) // small drag, fast flick forward
    nowSpy.mockReturnValueOnce(2060)
    gesture.onTouchEnd()
    expect(currentIndex.value).toBe(0)
    expect(onSwipeEnd).toHaveBeenCalledWith(0)
    nowSpy.mockRestore()
  })

  it('wraps a backward flick before the first item to the last index', () => {
    const { gesture, currentIndex, onSwipeEnd } = mountGesture({ loop: true }, ref(0))
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(3000)
    gesture.onTouchStart({ detail: { x: 0, y: 0 } })
    nowSpy.mockReturnValueOnce(3050).mockReturnValueOnce(3050)
    gesture.onTouchMove({ detail: { x: 20, y: 0 } }) // small drag, fast flick backward
    nowSpy.mockReturnValueOnce(3060)
    gesture.onTouchEnd()
    expect(currentIndex.value).toBe(3)
    expect(onSwipeEnd).toHaveBeenCalledWith(3)
    nowSpy.mockRestore()
  })
})

describe('useDragGesture — RTL', () => {
  it('flips both the drag delta and the rendered transform sign', () => {
    const { gesture, setStyleProperty } = mountGesture({ rtl: true }, ref(2))
    gesture.onTouchStart({ detail: { x: 100, y: 0 } })
    gesture.onTouchMove({ detail: { x: 130, y: 0 } }) // finger moves right (+30)
    // RTL flips the raw +30 delta to -30 before clamping (offset -200 -> -230),
    // then flips the transform sign again at paint time: -230 -> +230.
    expect(setStyleProperty).toHaveBeenCalledWith('transform', 'translateX(230px)')
  })
})

describe('useDragGesture — align nudge', () => {
  it('applies the align="center" nudge to the rendered transform', () => {
    const { gesture, setStyleProperty } = mountGesture({ align: 'center', containerWidth: 300, itemWidth: 100 })
    gesture.onTouchStart({ detail: { x: 0, y: 0 } })
    gesture.onTouchEnd() // no drag; settles back to index 0 but the nudge still applies
    expect(setStyleProperty).toHaveBeenCalledWith('transform', 'translateX(100px)')
  })
})

describe('useDragGesture — setIndex (programmatic)', () => {
  it('clamps to [0, count-1] in non-loop mode', () => {
    const { gesture, currentIndex } = mountGesture()
    gesture.setIndex(2)
    expect(currentIndex.value).toBe(2)
    gesture.setIndex(99)
    expect(currentIndex.value).toBe(3)
    gesture.setIndex(-5)
    expect(currentIndex.value).toBe(0)
  })

  it('wraps modularly in loop mode', () => {
    const { gesture, currentIndex } = mountGesture({ loop: true })
    gesture.setIndex(5) // count=4 -> 5 % 4 = 1
    expect(currentIndex.value).toBe(1)
    gesture.setIndex(-1)
    expect(currentIndex.value).toBe(3)
  })

  it('is a no-op when itemCount is 0', () => {
    const { gesture, currentIndex } = mountGesture({ itemCount: 0 })
    gesture.setIndex(2)
    expect(currentIndex.value).toBe(0)
  })
})

// Lynx web dispatches raw mouse events and never synthesizes touch from them,
// so on desktop the mouse wrappers are the ONLY drag path. They feed the same
// coordinate cores as touch — what these lock is the wrapper rules, which is
// where every desktop-only regression has landed so far.
describe('useDragGesture — desktop mouse twins', () => {
  it('exposes the mouse handlers alongside the touch ones', () => {
    const { gesture } = mountGesture()
    expect(gesture.onMouseDown).toBeTypeOf('function')
    expect(gesture.onMouseMove).toBeTypeOf('function')
    expect(gesture.onMouseUp).toBeTypeOf('function')
  })

  it('a mouse drag past the snap threshold advances the index, same as touch', () => {
    const { gesture, currentIndex, onSwipeEnd, setStyleProperty } = mountGesture()
    // Same distances and clock as the touch twin above, so a divergence in the
    // shared core shows up as a difference between the two tests.
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000)
    gesture.onMouseDown({ clientX: 100, clientY: 0, buttons: 1 })
    now.mockReturnValue(1300)
    gesture.onMouseMove({ clientX: 30, clientY: 0, buttons: 1 }) // 70% of itemWidth
    now.mockReturnValue(1310)
    gesture.onMouseUp()
    expect(currentIndex.value).toBe(1)
    expect(onSwipeEnd).toHaveBeenCalledWith(1)
    expect(setStyleProperty).toHaveBeenCalledWith('transform', 'translateX(-100px)')
    now.mockRestore()
  })

  it('swallows the compatibility mousedown a touch browser replays after a tap', () => {
    const { gesture, onSwipeStart } = mountGesture()
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000)
    gesture.onTouchStart({ detail: { x: 100, y: 0 } })
    gesture.onTouchEnd() // stamps the touch timestamp
    onSwipeStart.mockClear()

    now.mockReturnValue(1400) // 400ms later — inside the replay window
    gesture.onMouseDown({ clientX: 100, clientY: 0, buttons: 1 })
    expect(onSwipeStart).not.toHaveBeenCalled()

    now.mockReturnValue(1600) // past it — a real mouse press must get through
    gesture.onMouseDown({ clientX: 100, clientY: 0, buttons: 1 })
    expect(onSwipeStart).toHaveBeenCalledTimes(1)
    now.mockRestore()
  })

  it('ignores a non-primary press instead of arming a phantom drag', () => {
    // A right/middle press that armed the gesture would be "released" by the
    // next hover move, teleporting the track.
    const { gesture, onSwipeStart } = mountGesture()
    gesture.onMouseDown({ clientX: 100, clientY: 0, buttons: 2 })
    expect(onSwipeStart).not.toHaveBeenCalled()
    gesture.onMouseDown({ clientX: 100, clientY: 0, buttons: 1 })
    expect(onSwipeStart).toHaveBeenCalledTimes(1)
  })

  it('ends the drag on a move whose buttons report the primary released', () => {
    // Recovers the mouseup lost when the pointer leaves the <lynx-view>.
    const { gesture, onSwipeEnd } = mountGesture()
    gesture.onMouseDown({ clientX: 100, clientY: 0, buttons: 1 })
    gesture.onMouseMove({ clientX: 60, clientY: 0, buttons: 0 })
    expect(onSwipeEnd).toHaveBeenCalledTimes(1)
  })

  it('keeps dragging when a move omits buttons entirely', () => {
    // Trackpad and synthetic moves can drop the field; treating a MISSING
    // `buttons` as a release lets go of the track mid-gesture.
    const { gesture, onSwipeEnd, setStyleProperty } = mountGesture()
    gesture.onMouseDown({ clientX: 100, clientY: 0, buttons: 1 })
    setStyleProperty.mockClear()
    gesture.onMouseMove({ clientX: 60, clientY: 0 })
    expect(onSwipeEnd).not.toHaveBeenCalled()
    expect(setStyleProperty).toHaveBeenCalled()
  })
})
