/**
 * useSafeArea — normalized device safe-area insets for Lynx containers.
 *
 * Lynx has no `env(safe-area-inset-*)`; each container injects insets as
 * global props under its own names:
 *  - Sparkling: `topHeight` / `bottomHeight` (plus an `os` prop)
 *  - Lynx Explorer: `safeAreaTop` / `safeAreaBottom`
 *
 * Ported from the vue-lynx `elk` example's `safe-area.ts`, OS gating
 * included: Android containers inset the LynxView natively, so their global
 * props normalize to zero rather than double-padding.
 *
 * Values are logical px, snapshotted once — global props don't change over a
 * page's lifetime. On web / jsdom there is no `lynx` global and the insets
 * are zero, so consumers can apply them unconditionally.
 */

import { createContext } from '../createContext.js'

export interface SafeAreaInsets {
  top: number
  bottom: number
}

const EMPTY_INSETS: SafeAreaInsets = { top: 0, bottom: 0 }

function toInset(value: unknown): number {
  const inset = typeof value === 'string' ? Number.parseFloat(value) : value
  return typeof inset === 'number' && Number.isFinite(inset) && inset > 0
    ? inset
    : 0
}

/** Normalize the safe-area values injected by a Lynx container's global props. */
export function getSafeAreaInsetsFromGlobalProps(
  globalProps?: Record<string, unknown>,
): SafeAreaInsets {
  const os = String(globalProps?.os ?? '').toLowerCase()
  const hasExplorerInsets = globalProps?.safeAreaTop !== undefined
    || globalProps?.safeAreaBottom !== undefined

  if (os === 'android' || (os !== 'ios' && !hasExplorerInsets))
    return EMPTY_INSETS

  return {
    top: toInset(globalProps?.topHeight ?? globalProps?.safeAreaTop),
    bottom: toInset(globalProps?.bottomHeight ?? globalProps?.safeAreaBottom),
  }
}

/** Snapshot the container's safe-area insets from `lynx.__globalProps`. */
export function getSafeAreaInsets(): SafeAreaInsets {
  try {
    return getSafeAreaInsetsFromGlobalProps(
      (globalThis as any).lynx?.__globalProps,
    )
  }
  catch {
    return EMPTY_INSETS
  }
}

const [injectSafeAreaInsets, provideSafeAreaInsets]
  = createContext<SafeAreaInsets>('SafeAreaProvider', 'SafeArea')

export { provideSafeAreaInsets }

/**
 * Safe-area insets for the current component tree. An ancestor that knows
 * better (a custom container, or an app opting a subtree out with zeros) can
 * override via `provideSafeAreaInsets`; otherwise this falls back to the
 * container's global props. Call during `setup()`.
 */
export function useSafeArea(): SafeAreaInsets {
  return injectSafeAreaInsets(null) ?? getSafeAreaInsets()
}
