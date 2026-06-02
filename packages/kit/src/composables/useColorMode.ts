import { computed, ref, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'

export type ColorMode = 'light' | 'dark'

/**
 * Color-mode CSS-var maps, applied **inline** via `:style` on the root.
 *
 * Lynx specifics (with `enableCSSInheritance: false`):
 *  - A stylesheet class change (`.dark { … }`) does NOT re-propagate CSS
 *    custom-property updates to mounted descendants — so toggling a `.dark`
 *    class doesn't flip the UI at runtime.
 *  - Inline `:style` vars DO propagate, but only as **value updates** of
 *    already-present keys (the path `--ui-radius` uses). Adding/removing keys
 *    doesn't re-propagate (that's why "switch back" got stuck when the dark map
 *    was swapped for `{}`).
 *
 * So both maps carry the **same keys** and we only flip the values — the root's
 * `:style` always has every token set; toggling just changes what they resolve
 * to. Mirrors `:root` / `.dark` in `style.css` (kept for web/SSR); keep in sync.
 */
export const LIGHT_VARS: Readonly<Record<string, string>> = {
  '--ui-primary': 'var(--ui-color-primary-500)',
  '--ui-secondary': 'var(--ui-color-secondary-500)',
  '--ui-success': 'var(--ui-color-success-500)',
  '--ui-info': 'var(--ui-color-info-500)',
  '--ui-warning': 'var(--ui-color-warning-500)',
  '--ui-error': 'var(--ui-color-error-500)',

  '--ui-text-dimmed': 'var(--ui-color-neutral-400)',
  '--ui-text-muted': 'var(--ui-color-neutral-500)',
  '--ui-text-toned': 'var(--ui-color-neutral-600)',
  '--ui-text': 'var(--ui-color-neutral-700)',
  '--ui-text-highlighted': 'var(--ui-color-neutral-900)',
  '--ui-text-inverted': '#fff',

  '--ui-bg': '#fff',
  '--ui-bg-muted': 'var(--ui-color-neutral-50)',
  '--ui-bg-elevated': 'var(--ui-color-neutral-100)',
  '--ui-bg-accented': 'var(--ui-color-neutral-200)',
  '--ui-bg-inverted': 'var(--ui-color-neutral-900)',

  '--ui-border': 'var(--ui-color-neutral-200)',
  '--ui-border-muted': 'var(--ui-color-neutral-200)',
  '--ui-border-accented': 'var(--ui-color-neutral-300)',
}

export const DARK_VARS: Readonly<Record<string, string>> = {
  '--ui-primary': 'var(--ui-color-primary-400)',
  '--ui-secondary': 'var(--ui-color-secondary-400)',
  '--ui-success': 'var(--ui-color-success-400)',
  '--ui-info': 'var(--ui-color-info-400)',
  '--ui-warning': 'var(--ui-color-warning-400)',
  '--ui-error': 'var(--ui-color-error-400)',

  '--ui-text-dimmed': 'var(--ui-color-neutral-500)',
  '--ui-text-muted': 'var(--ui-color-neutral-400)',
  '--ui-text-toned': 'var(--ui-color-neutral-300)',
  '--ui-text': 'var(--ui-color-neutral-200)',
  '--ui-text-highlighted': '#fff',
  '--ui-text-inverted': 'var(--ui-color-neutral-900)',

  '--ui-bg': 'var(--ui-color-neutral-900)',
  '--ui-bg-muted': 'var(--ui-color-neutral-800)',
  '--ui-bg-elevated': 'var(--ui-color-neutral-800)',
  '--ui-bg-accented': 'var(--ui-color-neutral-700)',
  '--ui-bg-inverted': '#fff',

  '--ui-border': 'var(--ui-color-neutral-800)',
  '--ui-border-muted': 'var(--ui-color-neutral-700)',
  '--ui-border-accented': 'var(--ui-color-neutral-700)',
}

/**
 * Module-level singleton so every `useColorMode()` call shares one reactive
 * source. Lynx has no global `<html>` to flag (the way nuxt/ui's `useColorMode`
 * toggles a class on the document), and a deep child can't reach up to toggle
 * an ancestor's class — so the consumer binds this to their **root `<view>`**
 * class:
 *
 * ```vue
 * const { isDark } = useColorMode()
 * const rootClass = computed(() => [isDark.value ? 'dark' : '', ...].join(' '))
 * <view :class="rootClass">…</view>
 * ```
 *
 * Flipping it from anywhere (e.g. `VyColorModeSwitch`) re-resolves the `.dark`
 * CSS vars across the whole tree — same mechanism as the configurable-color
 * palette classes.
 *
 * Persistence is intentionally left out for now (no DOM `localStorage` on Lynx);
 * a consumer can persist `mode` via their platform storage and seed it on boot.
 */
const mode = ref<ColorMode>('light')

export interface UseColorModeReturn {
  /** The active mode. Writable — set to `'light'` / `'dark'` directly. */
  mode: Ref<ColorMode>
  /** Two-way boolean view of `mode` (`true` ⇄ `'dark'`). Handy for `v-model`. */
  isDark: WritableComputedRef<boolean>
  /**
   * Inline CSS-var map to bind on the **root `<view>`** via `:style` —
   * {@link LIGHT_VARS} or {@link DARK_VARS} (always the same keys, flipped
   * values). This is what actually flips the UI live on Lynx (the class path
   * doesn't propagate, and add/remove of keys doesn't either):
   *
   * ```vue
   * const { style } = useColorMode()
   * const rootStyle = computed(() => ({ '--ui-radius': '0.25rem', ...style.value }))
   * <view :style="rootStyle">…</view>
   * ```
   */
  style: ComputedRef<Record<string, string>>
  /** Flip between light and dark. */
  toggle: () => void
}

export function useColorMode(): UseColorModeReturn {
  const isDark = computed<boolean>({
    get: () => mode.value === 'dark',
    set: (v) => { mode.value = v ? 'dark' : 'light' },
  })

  const style = computed<Record<string, string>>(() => ({ ...(isDark.value ? DARK_VARS : LIGHT_VARS) }))

  const toggle = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  return { mode, isDark, style, toggle }
}
