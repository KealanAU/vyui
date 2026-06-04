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
