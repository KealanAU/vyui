import { afterEach, describe, expect, it } from 'vitest'
import { getViewportSize } from './useViewport'

// The testing env installs a real `SystemInfo` (iPhone-shaped) on globalThis for
// the whole run, so each case sets what it needs and restores afterwards.
const original = (globalThis as any).SystemInfo

function setSystemInfo(value: unknown) {
  if (value === undefined) delete (globalThis as any).SystemInfo
  else (globalThis as any).SystemInfo = value
}

afterEach(() => {
  setSystemInfo(original)
})

describe('getViewportSize', () => {
  it('returns null off-Lynx', () => {
    setSystemInfo(undefined)
    expect(getViewportSize()).toBeNull()
  })

  it('returns null before SystemInfo fully resolves', () => {
    setSystemInfo({ pixelWidth: 1170 })
    expect(getViewportSize()).toBeNull()
  })

  it('converts physical pixels to logical px', () => {
    setSystemInfo({ pixelWidth: 1170, pixelHeight: 2532, pixelRatio: 3 })
    expect(getViewportSize()).toEqual({ width: 390, height: 844 })
  })

  it('rejects a zero pixelRatio', () => {
    setSystemInfo({ pixelWidth: 1170, pixelHeight: 2532, pixelRatio: 0 })
    expect(getViewportSize()).toBeNull()
  })
})
