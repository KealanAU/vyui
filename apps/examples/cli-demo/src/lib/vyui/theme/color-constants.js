/**
 * Single source of truth for the @vyui/kit semantic color set.
 *
 * Plain `.js` (CJS-compatible ESM, like `tailwind.js`) so BOTH planes can import
 * it: the runtime/TS plane via the sibling `color-constants.d.ts`, and the
 * build-time plane (`tailwind.js`, loaded by Tailwind's jiti) via the emitted
 * `dist/theme/color-constants.js`.
 *
 * `style.css` is the one file that CANNOT import this (it ships raw, never
 * compiled) — it stays hand-synced with `SEMANTIC_TO_PALETTE_DEFAULT` below.
 *
 * `neutral` is intentionally NOT part of `COLORS`, mirroring nuxt/ui's
 * `theme.colors`; use `ALL_COLORS` when a theme needs the full set.
 */

/**
 * Configurable semantic colors exposed on component `color` props, excluding
 * `neutral`. Consumers can replace the set via `appConfig.ui.colors` (runtime)
 * and `createVyuiPreset({ colors })` (build-time).
 */
export const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error']

/** The neutral color, kept out of the configurable list (nuxt/ui parity). */
export const NEUTRAL = 'neutral'

/** Every color a theme can emit: the configurable set plus neutral. */
export const ALL_COLORS = [...COLORS, NEUTRAL]

/** Tailwind shade steps used across scales and the preset safelist. */
export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

/**
 * Default semantic-color → Tailwind-palette mapping. Mirrors the CSS-variable
 * defaults in `style.css` so JS-resolved hex (Lynx SVG icon fills) matches the
 * `--ui-color-*-500` token Tailwind utilities resolve to. Keep the two in sync.
 */
export const SEMANTIC_TO_PALETTE_DEFAULT = {
  primary: 'green',
  secondary: 'blue',
  success: 'emerald',
  info: 'sky',
  warning: 'amber',
  error: 'red',
  neutral: 'slate',
}
