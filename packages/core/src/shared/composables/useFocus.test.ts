import { describe, expect, it, vi } from 'vitest'
import { useFocus } from './useFocus'

describe('useFocus', () => {
  it('no-ops on nullish input', () => {
    expect(() => useFocus(null)).not.toThrow()
    expect(() => useFocus(undefined)).not.toThrow()
  })

  it('uses the native invoke() path', () => {
    const exec = vi.fn()
    const invoke = vi.fn(() => ({ exec }))
    const el = { invoke }

    useFocus(el)

    expect(invoke).toHaveBeenCalledWith({ method: 'focus' })
    expect(exec).toHaveBeenCalledTimes(1)
  })

  it('falls back to DOM focus() on web/jsdom', () => {
    const focus = vi.fn()
    const el = { focus }

    useFocus(el)

    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('prefers invoke() over focus() when both exist', () => {
    const exec = vi.fn()
    const invoke = vi.fn(() => ({ exec }))
    const focus = vi.fn()
    const el = { invoke, focus }

    useFocus(el)

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(focus).not.toHaveBeenCalled()
  })

  it('no-ops when the element supports neither API', () => {
    expect(() => useFocus({})).not.toThrow()
  })

  it('swallows errors thrown by invoke()', () => {
    const el = {
      invoke: () => {
        throw new Error('cross-thread failure')
      },
    }
    expect(() => useFocus(el)).not.toThrow()
  })
})
