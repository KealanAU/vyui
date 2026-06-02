import { computed, ref, type Ref, type WritableComputedRef } from 'vue'

export type ColorMode = 'light' | 'dark'

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
  /** Flip between light and dark. */
  toggle: () => void
}

export function useColorMode(): UseColorModeReturn {
  const isDark = computed<boolean>({
    get: () => mode.value === 'dark',
    set: (v) => { mode.value = v ? 'dark' : 'light' },
  })

  const toggle = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  return { mode, isDark, toggle }
}
