/**
 * Single source of truth for the @vyui/kit semantic color set.
 *
 * This file is plain `.js` (CJS-compatible ESM, like `tailwind.js`) so it can
 * be imported by BOTH planes of the package:
 *   1. The runtime/TS plane (theme builders, `useStyledComponent`,
 *      `resolveColor`) — via the sibling `color-constants.d.ts` ambient types.
 *   2. The build-time plane (`tailwind.js`, loaded by Tailwind's jiti at the
 *      consumer build) — via a direct `require`/`import` of the emitted
 *      `dist/theme/color-constants.js` (Vite `preserveModules` emits it 1:1).
 *
 * `style.css` is the one file that CANNOT import this (it ships raw, never
 * compiled) — it stays hand-synced with `SEMANTIC_TO_PALETTE_DEFAULT` below.
 * See the cross-reference banner at the top of `style.css`.
 *
 * NOTE the split: `neutral` is intentionally NOT part of `COLORS`. It mirrors
 * nuxt/ui's `theme.colors` (which excludes neutral); components append it
 * explicitly. Use `COLORS` for the configurable semantic list and `ALL_COLORS`
 * (`[...COLORS, NEUTRAL]`) when a theme needs the full set including neutral.
 */

/**
 * Configurable semantic colors exposed on component `color` props.
 * Excludes `neutral` (see file banner). The default set; consumers can replace
 * it via `appConfig.ui.colors` (runtime) + `createVyuiPreset({ colors })`
 * (build-time).
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
 * defaults in `style.css` so JS-resolved hex (Lynx SVG icon fills, see
 * `resolveColor.ts`) matches the `--ui-color-*-500` token Tailwind utilities
 * resolve to. Keep in sync with the `:root` blocks in `style.css`.
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
