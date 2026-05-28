import { describe, expect, it, vi } from 'vitest'
import { useElementRect } from './useElementRect'

/** Builds a fake Lynx ShadowElement exposing `fields().exec()`. */
function makeShadowEl(rectData: any) {
  const exec = vi.fn()
  const fields = vi.fn((_opts: any, cb: (data: any) => void) => {
    // Simulate the async cross-thread callback firing on exec().
    exec.mockImplementation(() => cb(rectData))
    return { exec }
  })
  return { el: { fields }, fields, exec }
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

  it('uses the native fields() path and resolves the rect', async () => {
    const { el, fields, exec } = makeShadowEl({
      rect: { width: 200, height: 50, top: 10, left: 20, right: 220, bottom: 60 },
    })

    const rect = await useElementRect(el)

    expect(fields).toHaveBeenCalledWith({ rect: true, size: true }, expect.any(Function))
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

  it('handles native fields() data without a nested rect key', async () => {
    const { el } = makeShadowEl({ width: 5, height: 6, top: 0, left: 0, right: 5, bottom: 6 })
    const rect = await useElementRect(el)
    expect(rect.width).toBe(5)
    expect(rect.height).toBe(6)
  })

  it('derives width/height from edges when fields() omits them', async () => {
    // `fields({ rect })` returns only edges — no width/height.
    const { el } = makeShadowEl({ top: 10, left: 20, right: 220, bottom: 60 })
    const rect = await useElementRect(el)
    expect(rect.width).toBe(200)
    expect(rect.height).toBe(50)
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
