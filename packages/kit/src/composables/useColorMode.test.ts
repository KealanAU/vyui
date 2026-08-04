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

// Fake Lynx host: `theme` global prop for the boot snapshot, plus a
// GlobalEventEmitter whose `themechanged` listeners a test can fire to
// simulate the host pushing a live appearance change.
function stubLynxHost(theme?: 'light' | 'dark') {
  const listeners = new Set<(...args: unknown[]) => void>()
  ;(globalThis as unknown as { lynx?: unknown }).lynx = {
    __globalProps: theme ? { theme } : {},
    getJSModule: (name: string) => (name === 'GlobalEventEmitter'
      ? { addListener: (_e: string, cb: (...args: unknown[]) => void) => listeners.add(cb) }
      : undefined),
  }
  return {
    emitThemeChanged(...args: unknown[]) {
      listeners.forEach(cb => cb(...args))
    },
  }
}

describe('useColorMode', () => {
  beforeEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia
    delete (globalThis as unknown as { lynx?: unknown }).lynx
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

  it('system folds to a host-injected theme global prop at boot', () => {
    stubLynxHost('dark')
    resetColorModeForTesting()
    const { mode, isDark } = useColorMode()
    expect(mode.value).toBe('system')
    expect(isDark.value).toBe(true)
  })

  it('host theme global prop wins over matchMedia', () => {
    stubMatchMedia(true)
    stubLynxHost('light')
    resetColorModeForTesting()
    expect(useColorMode().isDark.value).toBe(false)
  })

  it('system tracks a host themechanged event', () => {
    const host = stubLynxHost('light')
    resetColorModeForTesting()
    const { isDark } = useColorMode() // first call subscribes to the emitter
    expect(isDark.value).toBe(false)
    host.emitThemeChanged('dark')
    expect(isDark.value).toBe(true)
    host.emitThemeChanged({ theme: 'light' })
    expect(isDark.value).toBe(false)
    host.emitThemeChanged('garbage') // ignored
    expect(isDark.value).toBe(false)
  })
})
