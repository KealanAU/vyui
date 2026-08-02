import { afterEach, describe, expect, it } from 'vitest'
import { getViewportSize } from './useViewport'

afterEach(() => {
  delete (globalThis as any).SystemInfo
})

describe('getViewportSize', () => {
  it('returns null off-Lynx / before SystemInfo resolves', () => {
    expect(getViewportSize()).toBeNull()
    ;(globalThis as any).SystemInfo = { pixelWidth: 1170 }
    expect(getViewportSize()).toBeNull()
  })

  it('converts physical pixels to logical px', () => {
    ;(globalThis as any).SystemInfo = { pixelWidth: 1170, pixelHeight: 2532, pixelRatio: 3 }
    expect(getViewportSize()).toEqual({ width: 390, height: 844 })
  })

  it('rejects a zero pixelRatio', () => {
    ;(globalThis as any).SystemInfo = { pixelWidth: 1170, pixelHeight: 2532, pixelRatio: 0 }
    expect(getViewportSize()).toBeNull()
  })
})
