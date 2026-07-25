import { describe, expect, it, vi } from 'vitest'

// In jsdom, vue-lynx's `runOnMainThread` dispatches an event into the void —
// the worklet body never runs, so we cannot assert against `element.animate()`
// calls otherwise. Mock it to invoke worklets synchronously in-process.
vi.mock('vue-lynx', async () => {
  const actual = await vi.importActual<typeof import('vue-lynx')>('vue-lynx')
  return {
    ...actual,
    runOnMainThread: (fn: (...args: any[]) => any) =>
      (...args: any[]) => {
        const result = fn(...args)
        return Promise.resolve(result)
      },
    useMainThreadRef: <T,>(init: T) => ({ current: init }),
  }
})

const { useAnimate } = await import('./useAnimate')

describe('useAnimate', () => {
  it('exposes elRef and an animation control surface', () => {
    const api = useAnimate()
    expect(api.elRef).toBeDefined()
    expect(typeof api.fadeIn).toBe('function')
    expect(typeof api.fadeOut).toBe('function')
    expect(typeof api.slideIn).toBe('function')
    expect(typeof api.slideOut).toBe('function')
    expect(typeof api.zoomIn).toBe('function')
    expect(typeof api.zoomOut).toBe('function')
    expect(typeof api.bounceIn).toBe('function')
  })

  it('no-ops when elRef.current has no animate() (web fallback)', () => {
    const { fadeIn, fadeOut, slideIn, slideOut, zoomIn, zoomOut, bounceIn } = useAnimate()
    expect(() => fadeIn(100)).not.toThrow()
    expect(() => fadeOut(100)).not.toThrow()
    expect(() => slideIn('up', 100)).not.toThrow()
    expect(() => slideOut('down', 100)).not.toThrow()
    expect(() => zoomIn(100)).not.toThrow()
    expect(() => zoomOut(100, true)).not.toThrow()
    expect(() => bounceIn(100)).not.toThrow()
  })

  it('calls element.animate() when the runtime supports it', async () => {
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() })
    const { elRef, fadeIn } = useAnimate()
    elRef.current = { animate }

    fadeIn(250)
    await Promise.resolve()
    await Promise.resolve()

    expect(animate).toHaveBeenCalledTimes(1)
    const [keyframes, options] = animate.mock.calls[0]
    expect(keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }])
    expect(options).toMatchObject({ duration: 250, fill: 'forwards' })
  })

  it('slideIn picks the correct axis + start percent per direction', async () => {
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() })
    const { elRef, slideIn } = useAnimate()
    elRef.current = { animate }

    slideIn('up', 200)
    slideIn('down', 200)
    slideIn('left', 200)
    slideIn('right', 200)
    await Promise.resolve()
    await Promise.resolve()

    const transforms = animate.mock.calls.map(([frames]) => frames[0].transform)
    expect(transforms).toEqual([
      'translateY(100%)', // up — from below
      'translateY(-100%)', // down — from above
      'translateX(-100%)', // left — from off the left edge
      'translateX(100%)', // right — from off the right edge
    ])
  })

  it('zoomIn prefixes translate(-50%, -50%) when centered=true', async () => {
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() })
    const { elRef, zoomIn } = useAnimate()
    elRef.current = { animate }

    zoomIn(300, true)
    await Promise.resolve()
    await Promise.resolve()

    const [keyframes] = animate.mock.calls[0]
    expect(keyframes[0].transform).toBe('translate(-50%, -50%) scale(0.9)')
    expect(keyframes[1].transform).toBe('translate(-50%, -50%) scale(1)')
  })

  it('zoomIn omits the translate prefix when centered=false', async () => {
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() })
    const { elRef, zoomIn } = useAnimate()
    elRef.current = { animate }

    zoomIn(300)
    await Promise.resolve()
    await Promise.resolve()

    const [keyframes] = animate.mock.calls[0]
    expect(keyframes[0].transform).toBe('scale(0.9)')
    expect(keyframes[1].transform).toBe('scale(1)')
  })
})

// Lynx web's animation PAPI reads Lynx-style timing keys (`fillMode` /
// `timingFunction`) and silently drops the WAAPI `fill` / `easing` spellings,
// so a fill-forwards preset finished fill-less on web and the element snapped
// back to its pre-animation value the instant the animation ended. Every
// preset therefore writes its END STATE inline first — the value the element
// rests on under either engine — and passes both key spellings.
describe('useAnimate — web PAPI fill/easing compatibility', () => {
  function mountAnimate() {
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() })
    const setStyleProperty = vi.fn()
    const api = useAnimate()
    api.elRef.current = { animate, setStyleProperty }
    return { ...api, animate, setStyleProperty }
  }

  // Two microtask ticks: `runOnMainThread` is mocked to resolve the worklet.
  const settle = () => Promise.resolve().then(() => Promise.resolve())

  it('sends both timing key spellings on every preset', async () => {
    const cases: Array<[string, (a: ReturnType<typeof mountAnimate>) => void, string]> = [
      ['fadeIn', a => a.fadeIn(200), 'ease-out'],
      ['fadeOut', a => a.fadeOut(200), 'ease-in'],
      ['slideIn', a => a.slideIn('up', 200), 'ease-out'],
      ['slideOut', a => a.slideOut('down', 200), 'ease-in'],
      ['zoomIn', a => a.zoomIn(200), 'ease-out'],
      ['zoomOut', a => a.zoomOut(200), 'ease-in'],
      ['bounceIn', a => a.bounceIn(200), 'ease-out'],
    ]
    for (const [name, run, easing] of cases) {
      const api = mountAnimate()
      run(api)
      await settle()
      const [, options] = api.animate.mock.calls[0]
      expect(options, name).toMatchObject({
        fill: 'forwards',
        fillMode: 'forwards',
        easing,
        timingFunction: easing,
      })
    }
  })

  it('rests opacity presets on their end value before animating', async () => {
    const fade = mountAnimate()
    fade.fadeIn(200)
    await settle()
    expect(fade.setStyleProperty).toHaveBeenCalledWith('opacity', '1')

    const out = mountAnimate()
    out.fadeOut(200)
    await settle()
    expect(out.setStyleProperty).toHaveBeenCalledWith('opacity', '0')
  })

  it('rests slideOut on where it travels TO, not where it starts', async () => {
    // The regression this catches is resting on the origin: the element would
    // animate out and then reappear in place.
    const api = mountAnimate()
    api.slideOut('down', 200) // [axis 1, -100] — leaves upward
    await settle()
    expect(api.setStyleProperty).toHaveBeenCalledWith('transform', 'translateY(-100%)')
    const [keyframes] = api.animate.mock.calls[0]
    expect(keyframes[keyframes.length - 1].transform).toBe('translateY(-100%)')
  })

  it('rests slideIn at the origin it lands on', async () => {
    const api = mountAnimate()
    api.slideIn('up', 200)
    await settle()
    expect(api.setStyleProperty).toHaveBeenCalledWith('transform', 'translateY(0%)')
  })

  it('rests zoom presets on both their end opacity and end transform', async () => {
    const zin = mountAnimate()
    zin.zoomIn(200, true)
    await settle()
    expect(zin.setStyleProperty).toHaveBeenCalledWith('opacity', '1')
    expect(zin.setStyleProperty).toHaveBeenCalledWith('transform', 'translate(-50%, -50%) scale(1)')

    const zout = mountAnimate()
    zout.zoomOut(200)
    await settle()
    expect(zout.setStyleProperty).toHaveBeenCalledWith('opacity', '0')
    expect(zout.setStyleProperty).toHaveBeenCalledWith('transform', 'scale(0.9)')
  })

  it('still animates on a runtime with no setStyleProperty', async () => {
    // The inline rest write must never become a hard requirement — native
    // element handles that only expose animate() have to keep working.
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() })
    const { elRef, fadeIn } = useAnimate()
    elRef.current = { animate }
    fadeIn(200)
    await settle()
    expect(animate).toHaveBeenCalledTimes(1)
  })
})
