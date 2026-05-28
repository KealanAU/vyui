import { describe, expect, it, vi } from 'vitest'
import { useResizeObserver } from './useResizeObserver'

describe('useResizeObserver', () => {
  it('returns an onLayoutChange handler', () => {
    const { onLayoutChange } = useResizeObserver(() => {})
    expect(typeof onLayoutChange).toBe('function')
  })

  it('forwards the rect from event.detail', () => {
    const cb = vi.fn()
    const { onLayoutChange } = useResizeObserver(cb)

    onLayoutChange({
      detail: { width: 120, height: 40, top: 1, left: 2, right: 122, bottom: 42 },
    })

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith({
      width: 120,
      height: 40,
      top: 1,
      left: 2,
      right: 122,
      bottom: 42,
    })
  })

  it('forwards the rect from event.params (Android deprecated path)', () => {
    const cb = vi.fn()
    const { onLayoutChange } = useResizeObserver(cb)

    onLayoutChange({ params: { width: 64, height: 64 } })

    expect(cb).toHaveBeenCalledWith({
      width: 64,
      height: 64,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    })
  })

  it('zero-fills missing fields and non-numeric values', () => {
    const cb = vi.fn()
    const { onLayoutChange } = useResizeObserver(cb)

    onLayoutChange({ detail: { width: 'oops' as any } })

    expect(cb).toHaveBeenCalledWith({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    })
  })

  it('does not throw on an undefined event', () => {
    const cb = vi.fn()
    const { onLayoutChange } = useResizeObserver(cb)

    expect(() => onLayoutChange(undefined)).not.toThrow()
    expect(cb).toHaveBeenCalledWith({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    })
  })
})
