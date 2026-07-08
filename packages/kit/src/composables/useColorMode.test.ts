import { beforeEach, describe, expect, it } from 'vitest'
import { resetColorModeForTesting, useColorMode } from './useColorMode'

// jsdom ships no `matchMedia`, so the composable seeds `systemDark = false`
// unless a test installs a stub. Assign it on `window` directly (the composable
// reads `window.matchMedia`; `vi.stubGlobal` only lands on `globalThis`). The
// stub reports a fixed OS preference and captures the `change` listener so a
// test can simulate the OS flipping.
function stubMatchMedia(dark: boolean) {
  const listeners = new Set<() => void>()
  const mql = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: () => void) => listeners.delete(cb),
  }
  ;(window as unknown as { matchMedia: (q: string) => typeof mql }).matchMedia = (query: string) => {
    mql.media = query
    return mql
  }
  return {
    set(next: boolean) {
      mql.matches = next
      listeners.forEach(cb => cb())
    },
  }
}

describe('useColorMode', () => {
  beforeEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia
    resetColorModeForTesting()
  })

  it('defaults to system mode', () => {
    expect(useColorMode().mode.value).toBe('system')
  })

  it('isDark reflects an explicit mode regardless of OS', () => {
    const { isDark, setMode } = useColorMode()
    setMode('dark')
    expect(isDark.value).toBe(true)
    setMode('light')
    expect(isDark.value).toBe(false)
  })

  it('shares one singleton across calls', () => {
    const a = useColorMode()
    const b = useColorMode()
    a.setMode('dark')
    expect(b.mode.value).toBe('dark')
    expect(b.isDark.value).toBe(true)
  })

  it('toggle flips relative to what is shown', () => {
    const { mode, toggle, setMode } = useColorMode()
    setMode('light')
    toggle()
    expect(mode.value).toBe('dark')
    toggle()
    expect(mode.value).toBe('light')
  })

  it('system folds to the OS appearance at boot', () => {
    stubMatchMedia(true)
    resetColorModeForTesting()
    const { mode, isDark } = useColorMode()
    expect(mode.value).toBe('system')
    expect(isDark.value).toBe(true)
  })

  it('toggle from system pins the opposite of the current appearance', () => {
    stubMatchMedia(false) // OS light → system shows light → first toggle → dark
    resetColorModeForTesting()
    const { mode, toggle } = useColorMode()
    toggle()
    expect(mode.value).toBe('dark')
  })

  it('system tracks a live OS change on web', () => {
    const os = stubMatchMedia(false)
    resetColorModeForTesting()
    const { isDark } = useColorMode() // first call subscribes to the media query
    expect(isDark.value).toBe(false)
    os.set(true)
    expect(isDark.value).toBe(true)
  })
})
