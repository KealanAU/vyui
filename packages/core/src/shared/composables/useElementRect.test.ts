import { describe, expect, it, vi } from 'vitest'
import { useElementRect } from './useElementRect'

/** Builds a fake Lynx ShadowElement exposing `invoke().exec()`. */
function makeShadowEl(rectData: any) {
  const exec = vi.fn()
  const invoke = vi.fn((opts: any) => {
    // Simulate the cross-thread `boundingClientRect` callback firing on exec().
    exec.mockImplementation(() => opts.success?.(rectData))
    return { exec }
  })
  return { el: { invoke }, invoke, exec }
}

describe('useElementRect', () => {
  it('resolves a zeroed rect for nullish input', async () => {
    expect(await useElementRect(null)).toEqual({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    })
    expect(await useElementRect(undefined)).toEqual({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    })
  })

  it('uses the native invoke() path and resolves the rect', async () => {
    const { el, invoke, exec } = makeShadowEl({
      width: 200,
      height: 50,
      top: 10,
      left: 20,
      right: 220,
      bottom: 60,
    })

    const rect = await useElementRect(el)

    expect(invoke).toHaveBeenCalledWith(expect.objectContaining({
      method: 'boundingClientRect',
      params: {},
      success: expect.any(Function),
      fail: expect.any(Function),
    }))
    expect(exec).toHaveBeenCalledTimes(1)
    expect(rect).toEqual({
      width: 200,
      height: 50,
      top: 10,
      left: 20,
      right: 220,
      bottom: 60,
    })
  })

  it('derives width/height from edges when the response omits them', async () => {
    const { el } = makeShadowEl({ top: 10, left: 20, right: 220, bottom: 60 })
    const rect = await useElementRect(el)
    expect(rect.width).toBe(200)
    expect(rect.height).toBe(50)
  })

  it('resolves a zeroed rect when invoke() reports failure', async () => {
    const exec = vi.fn()
    const invoke = vi.fn((opts: any) => {
      exec.mockImplementation(() => opts.fail?.({ code: 1, data: 'nope' }))
      return { exec }
    })
    const rect = await useElementRect({ invoke })
    expect(rect).toEqual({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 })
  })

  it('falls back to getBoundingClientRect on web/jsdom', async () => {
    const el = {
      getBoundingClientRect: vi.fn(() => ({
        width: 80,
        height: 30,
        top: 4,
        left: 8,
        right: 88,
        bottom: 34,
      })),
    }

    const rect = await useElementRect(el)

    expect(el.getBoundingClientRect).toHaveBeenCalledTimes(1)
    expect(rect).toEqual({
      width: 80,
      height: 30,
      top: 4,
      left: 8,
      right: 88,
      bottom: 34,
    })
  })

  it('resolves a zeroed rect when the element supports neither API', async () => {
    expect(await useElementRect({})).toEqual({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    })
  })
})
