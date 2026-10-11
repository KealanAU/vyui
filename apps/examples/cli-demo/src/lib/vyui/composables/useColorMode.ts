import { computed, ref, type ComputedRef, type Ref } from 'vue'

/**
 * Color mode a consumer can request. `'system'` follows the device appearance;
 * `'light'` / `'dark'` pin it. Resolved to a boolean by {@link useColorMode}'s
 * `isDark`.
 */
export type ColorMode = 'light' | 'dark' | 'system'

/**
 * The host-injected appearance, if any. Native hosts push the device theme as a
 * `theme: 'light' | 'dark'` global prop — a boot-time snapshot; live changes
 * arrive via the `themechanged` global event instead.
 */
function readGlobalPropsTheme(): 'light' | 'dark' | null {
  try {
    const theme = (globalThis as { lynx?: { __globalProps?: { theme?: unknown } } })
      .lynx?.__globalProps?.theme
    return theme === 'dark' || theme === 'light' ? theme : null
  } catch {
    return null
  }
}

/**
 * Best-effort "is the OS in dark mode?" probe: the host's `theme` global prop on
 * Lynx native, `matchMedia` on web, `false` otherwise. Never throws — safe under
 * SSR / jsdom / tests.
 */
function detectSystemDark(): boolean {
  const injected = readGlobalPropsTheme()
  if (injected) return injected === 'dark'
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  }
  return false
}

// An app has exactly one color mode, so the state lives at module scope and
// every `useColorMode()` call shares it.
const mode = ref<ColorMode>('system')
const systemDark = ref<boolean>(detectSystemDark())

/**
 * Resolved dark state: the OS appearance in `'system'`, otherwise the pinned
 * mode. This is what the app root binds its `.dark` class to.
 */
const isDark: ComputedRef<boolean> = computed(() =>
  mode.value === 'system' ? systemDark.value : mode.value === 'dark',
)

function setMode(next: ColorMode): void {
  mode.value = next
}

/** Flip to the opposite of what's *currently shown*, pinning an explicit mode. */
function toggle(): void {
  mode.value = isDark.value ? 'light' : 'dark'
}

// Keep `'system'` live: on web by tracking the media query, on Lynx native by
// listening for the host's `themechanged` global event. Subscribed once,
// lazily; the singleton lives for the app lifetime so it's never torn down.
let subscribed = false
function subscribeToSystemChanges(): void {
  if (subscribed) return
  subscribed = true

  const lynxGlobal = (globalThis as { lynx?: { getJSModule?: (name: string) => any } }).lynx
  if (typeof lynxGlobal?.getJSModule === 'function') {
    try {
      const emitter = lynxGlobal.getJSModule('GlobalEventEmitter')
      emitter?.addListener?.('themechanged', (...args: unknown[]) => {
        const arg = args[0] as string | { theme?: string } | undefined
        const theme = typeof arg === 'string' ? arg : arg?.theme
        if (theme === 'dark' || theme === 'light') systemDark.value = theme === 'dark'
      })
    } catch {
      // No emitter — boot snapshot stands.
    }
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => { systemDark.value = detectSystemDark() }
    // Modern browsers use `addEventListener`; Safari < 14 only has `addListener`.
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange)
    else if (typeof (mql as { addListener?: (cb: () => void) => void }).addListener === 'function')
      (mql as { addListener: (cb: () => void) => void }).addListener(onChange)
  } catch {
    // matchMedia present but unusable — leave `'system'` at its boot value.
  }
}

/** Reactive surface returned by {@link useColorMode}. */
export interface UseColorModeReturn {
  /** The requested mode: `'light' | 'dark' | 'system'`. Writable. */
  mode: Ref<ColorMode>
  /** Resolved dark state (`'system'` folded to the OS appearance). */
  isDark: ComputedRef<boolean>
  /** Set the requested mode. */
  setMode: (next: ColorMode) => void
  /** Flip between an explicit `'light'` / `'dark'` based on what's shown now. */
  toggle: () => void
}

/**
 * Reactive color mode for a @vyui/kit app. Holds one shared `'light' | 'dark' |
 * 'system'` value and resolves it to `isDark`; the dark palette itself lives in
 * `style.css` (the `.dark` ramp), so this only decides *when* that ramp applies.
 *
 * App-root contract — bind two things on your app's root element:
 *   • `:class="{ dark: colorMode.isDark }"` — custom-property inheritance flows
 *     the `.dark` ramp to every descendant.
 *   • `:key="colorMode.mode"` — Lynx native applies a class change only to
 *     *freshly mounted* nodes, so toggling the class on a mounted tree wouldn't
 *     re-skin it. Keying on `mode` remounts the subtree on every change. Cost: a
 *     brief blink and loss of component-local state, so hoist app state above
 *     this shell. On web the class cascades live and the `:key` is harmless.
 */
export function useColorMode(): UseColorModeReturn {
  subscribeToSystemChanges()
  return { mode, isDark, setMode, toggle }
}

/**
 * @internal Reset the module singleton to its defaults. Test-only — imported
 * directly from this module, never re-exported through the package entry.
 */
export function resetColorModeForTesting(): void {
  mode.value = 'system'
  systemDark.value = detectSystemDark()
  subscribed = false
}
