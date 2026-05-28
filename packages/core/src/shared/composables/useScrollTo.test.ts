import { describe, expect, it, vi } from 'vitest'
import { useScrollTo } from './useScrollTo'

/** Builds a fake Lynx scroll-view exposing `invoke().exec()`. */
function makeNativeScrollView() {
  const exec = vi.fn()
  const invoke = vi.fn(() => ({ exec }))
  return { el: { invoke } as any, invoke, exec }
}

describe('useScrollTo', () => {
  describe('scrollToOffset', () => {
    it('uses the native invoke() scrollTo op', () => {
      const { el, invoke, exec } = makeNativeScrollView()
      const { scrollToOffset } = useScrollTo(el)

      scrollToOffset(150)

      expect(invoke).toHaveBeenCalledWith({
        method: 'scrollTo',
        params: { offset: 150, smooth: true },
      })
      expect(exec).toHaveBeenCalledTimes(1)
    })

    it('passes smooth: false through', () => {
      const { el, invoke } = makeNativeScrollView()
      const { scrollToOffset } = useScrollTo(el)

      scrollToOffset(0, { smooth: false })

      expect(invoke).toHaveBeenCalledWith({
        method: 'scrollTo',
        params: { offset: 0, smooth: false },
      })
    })

    it('falls back to DOM scrollTo on web/jsdom', () => {
      const scrollTo = vi.fn()
      const { scrollToOffset } = useScrollTo({ scrollTo } as any)

      scrollToOffset(90)

      expect(scrollTo).toHaveBeenCalledWith({ top: 90, behavior: 'smooth' })
    })

    it('falls back to DOM scrollTo on the x axis', () => {
      const scrollTo = vi.fn()
      const { scrollToOffset } = useScrollTo({ scrollTo } as any)

      scrollToOffset(45, { axis: 'x', smooth: false })

      expect(scrollTo).toHaveBeenCalledWith({ left: 45, behavior: 'auto' })
    })
  })

  describe('scrollBy', () => {
    it('uses DOM scrollBy on web/jsdom', async () => {
      const scrollBy = vi.fn()
      const { scrollBy: doScrollBy } = useScrollTo({ scrollBy } as any)

      await doScrollBy(120)

      expect(scrollBy).toHaveBeenCalledWith({ top: 120, behavior: 'smooth' })
    })

    it('reads the current offset and scrollTo on native', async () => {
      const { el, invoke } = makeNativeScrollView()
      el.scrollTop = 100
      el.scrollLeft = 0
      const { scrollBy } = useScrollTo(el)

      await scrollBy(50)

      expect(invoke).toHaveBeenCalledWith({
        method: 'scrollTo',
        params: { offset: 150, smooth: true },
      })
    })
  })

  describe('scrollIntoView', () => {
    it('no-ops on nullish child', async () => {
      const { el } = makeNativeScrollView()
      const { scrollIntoView } = useScrollTo(el)
      await expect(scrollIntoView(null)).resolves.toBeUndefined()
    })

    it('uses DOM scrollIntoView on web/jsdom', async () => {
      const childScrollIntoView = vi.fn()
      const { scrollIntoView } = useScrollTo({ scrollTo: vi.fn() } as any)

      await scrollIntoView({ scrollIntoView: childScrollIntoView })

      expect(childScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
      })
    })

    it('computes a native scrollTo offset from measured rects', async () => {
      // The scroll-view's `invoke` handles both `boundingClientRect` rect
      // queries (used by useElementRect) and the final `scrollTo` op.
      const exec = vi.fn()
      const invoke = vi.fn((opts: any) => {
        if (opts.method === 'boundingClientRect')
          return { exec: () => opts.success?.({ top: 0, left: 0, right: 0, bottom: 0 }) }
        return { exec }
      })
      const el: any = { invoke, scrollTop: 0, scrollLeft: 0 }
      const childEl = {
        invoke: vi.fn((opts: any) => ({
          exec: () => opts.success?.({ top: 200, left: 0, right: 0, bottom: 0 }),
        })),
      }

      const { scrollIntoView } = useScrollTo(el)
      await scrollIntoView(childEl)

      expect(invoke).toHaveBeenCalledWith(expect.objectContaining({
        method: 'scrollTo',
        params: { offset: 200, smooth: true },
      }))
    })
  })
})
