import { describe, expect, it, vi } from 'vitest'
import { useTouchEmulation } from './useTouchEmulation'

describe('useTouchEmulation', () => {
  it('omits bindtouchstart / bindmousedown when onTouchStart is not provided', () => {
    const handlers = useTouchEmulation({}).value
    expect(handlers.bindtouchstart).toBeUndefined()
    expect(handlers.bindmousedown).toBeUndefined()
    expect(handlers.bindtouchmove).toBeUndefined()
    expect(handlers.bindmousemove).toBeUndefined()
    expect(handlers.bindtouchend).toBeUndefined()
    expect(handlers.bindmouseup).toBeUndefined()
    expect(handlers.bindtouchcancel).toBeUndefined()
  })

  it('wires both bindtouchstart and bindmousedown when onTouchStart is provided', () => {
    const onTouchStart = vi.fn()
    const handlers = useTouchEmulation({ onTouchStart }).value

    expect(typeof handlers.bindtouchstart).toBe('function')
    expect(typeof handlers.bindmousedown).toBe('function')

    // Native touch passes through unchanged.
    const touchEvt = { touches: [{ clientX: 10, clientY: 20 }], changedTouches: [] } as any
    handlers.bindtouchstart!(touchEvt)
    expect(onTouchStart).toHaveBeenCalledTimes(1)
    expect(onTouchStart).toHaveBeenLastCalledWith(touchEvt)

    // Mouse is translated into a synthetic touch shape.
    const mouseEvt = { pageX: 30, pageY: 40, clientX: 30, clientY: 40 } as any
    handlers.bindmousedown!(mouseEvt)
    expect(onTouchStart).toHaveBeenCalledTimes(2)
    const synthetic = onTouchStart.mock.calls[1][0] as any
    expect(synthetic.touches[0].clientX).toBe(30)
    expect(synthetic.touches[0].clientY).toBe(40)
    expect(synthetic.changedTouches[0].pageX).toBe(30)
    expect(synthetic.detail).toEqual({ x: 30, y: 40 })
  })

  it('bindmousemove skips when no left button is held', () => {
    const onTouchMove = vi.fn()
    const handlers = useTouchEmulation({ onTouchMove }).value

    // buttons missing / 0 → skip.
    handlers.bindmousemove!({ pageX: 1, pageY: 2, clientX: 1, clientY: 2 } as any)
    handlers.bindmousemove!({ buttons: 0, pageX: 1, pageY: 2, clientX: 1, clientY: 2 } as any)
    expect(onTouchMove).not.toHaveBeenCalled()

    // buttons with right-only (bit 2) → skip.
    handlers.bindmousemove!({ buttons: 2, pageX: 1, pageY: 2, clientX: 1, clientY: 2 } as any)
    expect(onTouchMove).not.toHaveBeenCalled()

    // buttons with left held (bit 1) → fires.
    handlers.bindmousemove!({ buttons: 1, pageX: 5, pageY: 6, clientX: 5, clientY: 6 } as any)
    expect(onTouchMove).toHaveBeenCalledTimes(1)
    const synthetic = onTouchMove.mock.calls[0][0] as any
    expect(synthetic.changedTouches[0].clientX).toBe(5)
  })

  it('bindtouchend translates mouseup with empty touches and populates changedTouches', () => {
    const onTouchEnd = vi.fn()
    const handlers = useTouchEmulation({ onTouchEnd }).value

    handlers.bindmouseup!({ pageX: 7, pageY: 8, clientX: 7, clientY: 8 } as any)
    expect(onTouchEnd).toHaveBeenCalledTimes(1)
    const synthetic = onTouchEnd.mock.calls[0][0] as any
    expect(synthetic.touches).toEqual([])
    expect(synthetic.changedTouches[0].clientX).toBe(7)
    expect(synthetic.detail).toEqual({ x: 7, y: 8 })
  })

  it('bindtouchcancel is only wired when onTouchCancel is supplied', () => {
    expect(useTouchEmulation({}).value.bindtouchcancel).toBeUndefined()
    const onTouchCancel = vi.fn()
    const handlers = useTouchEmulation({ onTouchCancel }).value
    expect(typeof handlers.bindtouchcancel).toBe('function')
    const evt = { touches: [], changedTouches: [{ clientX: 0, clientY: 0 }] } as any
    handlers.bindtouchcancel!(evt)
    expect(onTouchCancel).toHaveBeenCalledWith(evt)
  })
})
