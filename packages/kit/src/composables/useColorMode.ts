import { computed, ref, type ComputedRef, type Ref } from 'vue'

/**
 * Color mode a consumer can request. `'system'` follows the device appearance;
 * `'light'` / `'dark'` pin it. Resolved to a boolean by {@link useColorMode}'s
 * `isDark`.
 */
export type ColorMode = 'light' | 'dark' | 'system'

/**
 * Best-effort "is the OS in dark mode?" probe. Honest about the platform:
 *   • Web (docs playground, web-target Lynx): `matchMedia` — real and live.
 *   • Lynx native: no stable appearance global is exposed yet, so this returns
 *     `false` (light). This is the single seam to wire the device signal —
 *     swap the body here once the host provides one.
 * Never throws — safe under SSR / jsdom / tests (no `window`).
 */
function detectSystemDark(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  }
  return false
}

// ── Module singleton ─────────────────────────────────────────────────────────
// An app has exactly one color mode, so the state lives at module scope and
// every `useColorMode()` call shares it (Vue refs are reactive standalone — no
// component instance or provide/inject needed).
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

// Keep `'system'` live on web by tracking the media query. No-op on Lynx native
// / SSR (no `matchMedia`). Subscribed once, lazily, from the first composable
// call; the singleton lives for the app lifetime so it's never torn down.
let subscribed = false
function subscribeToSystemChanges(): void {
  if (subscribed) return
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => { systemDark.value = detectSystemDark() }
    // Modern browsers use `addEventListener`; Safari < 14 only has `addListener`.
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange)
    else if (typeof (mql as { addListener?: (cb: () => void) => void }).addListener === 'function')
      (mql as { addListener: (cb: () => void) => void }).addListener(onChange)
    subscribed = true
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
 * `style.css` (the `.dark` ramp), so this composable only decides *when* that
 * ramp is active — it touches no styles directly.
 *
 * ── App-root contract ────────────────────────────────────────────────────────
 * Bind two things on your app's root element:
 *
 * ```vue
 * <script setup lang="ts">
 * import { useColorMode } from '@vyui/kit'
 * const colorMode = useColorMode()
 * </script>
 *
 * <template>
 *   <view :class="{ dark: colorMode.isDark }" :key="colorMode.mode" class="…">
 *     <!-- app -->
 *   </view>
 * </template>
 * ```
 *
 *   • `:class="{ dark: isDark }"` — custom-property inheritance flows the `.dark`
 *     ramp to every descendant. At launch the class is set *before* the tree
 *     mounts, so "follows the OS setting" needs nothing more — fresh mounts pick
 *     up the ancestor's ramp. This is most of dark mode's value on mobile.
 *   • `:key="mode"` — Lynx native applies a class change only to *freshly
 *     mounted* nodes, so toggling the class on an already-mounted tree wouldn't
 *     re-skin it. Keying on `mode` remounts the subtree on every change, turning
 *     that platform quirk into the mechanism: every node re-mounts under the new
 *     class → correct in both directions. Cost: a brief blink and loss of
 *     component-local state, so hoist app state above this shell (Lynx apps
 *     largely do already). On web the class cascades live, so the `:key` is a
 *     harmless no-op remount there.
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
