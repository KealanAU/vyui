/**
 * @vyui/kit Tailwind preset.
 *
 * Wires the semantic color names used by every theme file (`bg-primary-500`,
 * `text-error-50`, etc.) to the CSS variables defined in `style.css`. Also
 * pre-safelists the color × shade × utility combinations that the themes
 * generate via template literals (Tailwind's static scanner cannot see them).
 *
 * Plain `.js` (CJS-compatible) so Tailwind's jiti-based config loader can
 * import it through package `exports` on any Node version. The color list is
 * shared with the TS/runtime plane via `./theme/color-constants.js` (the single
 * source of truth).
 *
 * Usage (default color set):
 * ```ts
 * import vyuiPreset from '@vyui/kit/tailwind'
 * export default {
 *   content: [...],
 *   presets: [lynxPreset, vyuiPreset],
 * }
 * ```
 *
 * Usage (custom color set — must mirror `appConfig.ui.colors`):
 * ```ts
 * import { createVyuiPreset } from '@vyui/kit/tailwind'
 * export default {
 *   presets: [lynxPreset, createVyuiPreset({ colors: [...COLORS, 'tertiary'] })],
 * }
 * ```
 *
 * @typedef {import('tailwindcss').Config} TailwindConfig
 */

import { COLORS, NEUTRAL, SHADES } from './theme/color-constants.js'

// Re-exported so a Tailwind config can extend the default set without pulling in
// the component barrel (`@vyui/kit`) through jiti:
//   import vyuiPreset, { createVyuiPreset, COLORS } from '@vyui/kit/tailwind'
export { COLORS, NEUTRAL } from './theme/color-constants.js'

const buildScale = (name, neutral, shades) =>
  Object.fromEntries([
    ...shades.map((shade) => [shade, `var(--ui-color-${name}-${shade})`]),
    // Mode-aware shorthand. `neutral` has no `--ui-neutral` (matches Nuxt UI),
    // so skip DEFAULT for it.
    ...(name === neutral ? [] : [['DEFAULT', `var(--ui-${name})`]]),
  ])

/**
 * Border-radius scale wired to `--ui-radius` (defined in `style.css`).
 * Mirrors nuxt/ui v3's ratios so every `rounded-*` utility rescales when the
 * single var is overridden. `none` and `full` keep Tailwind's defaults.
 */
const RADIUS_SCALE = {
  xs: 'calc(var(--ui-radius) * 0.5)',
  sm: 'var(--ui-radius)',
  DEFAULT: 'var(--ui-radius)',
  md: 'calc(var(--ui-radius) * 1.5)',
  lg: 'calc(var(--ui-radius) * 2)',
  xl: 'calc(var(--ui-radius) * 3)',
  '2xl': 'calc(var(--ui-radius) * 4)',
  '3xl': 'calc(var(--ui-radius) * 6)',
}

/**
 * Build the @vyui/kit preset for a given color set. Defaults to the package's
 * standard semantic colors; pass `colors` to add/replace them (keep this in
 * sync with `appConfig.ui.colors` and the `--ui-color-*` CSS var blocks).
 *
 * @param {object} [options]
 * @param {string[]} [options.colors] Configurable semantic colors (no neutral).
 * @param {string}   [options.neutral] Neutral color name.
 * @param {number[]} [options.shades] Tailwind shade steps.
 * @returns {Partial<TailwindConfig>}
 */
export function createVyuiPreset({ colors = COLORS, neutral = NEUTRAL, shades = SHADES } = {}) {
  const allColors = [...new Set([...colors, neutral])]
  return {
    theme: {
      extend: {
        colors: Object.fromEntries(
          allColors.map((name) => [name, buildScale(name, neutral, shades)]),
        ),
        borderRadius: RADIUS_SCALE,
        // Halve every numeric step of the borderWidth scale. The bare
        // `border` utility uses `DEFAULT`; `border-2` / `border-4` keep their
        // names but render at half-pixel widths so the whole project's stroke
        // weight reads thinner without rewriting every component. `border-0`
        // and `border-8` are left at their stock values (the former is "off",
        // the latter is a deliberate fat outline).
        borderWidth: {
          DEFAULT: '0.5px',
          2: '1px',
          4: '2px',
        },
      },
    },
    safelist: [
      {
        pattern: new RegExp(
          `(bg|text|ring|border)-(${allColors.join('|')})-(${shades.join('|')})`,
        ),
        // State/attribute variants the kit themes pair with dynamic color
        // utilities. CSS inheritance is off on Lynx, so state-driven foreground
        // colors live on child text/icon slots and read the parent's state via
        // the `group-data-[…]` forms — both the self (`data-[…]`) and group
        // (`group-data-[…]`) forms must be safelisted or the scanner purges them.
        variants: [
          'hover',
          'active',
          'focus',
          'disabled',
          'data-[highlighted]',
          'data-[state=active]',
          'data-[state=on]',
          'data-[state=open]',
          'data-[state=checked]',
          'group-data-[highlighted]',
          'group-data-[state=active]',
          'group-data-[state=completed]',
          'group-data-[state=inactive]',
          'group-data-[state=on]',
          'group-data-[state=open]',
          'group-data-[state=checked]',
        ],
      },
      'text-white',
    ],
  }
}

/** Default preset (standard color set). Keeps `presets: [..., vyuiPreset]` working. */
export default createVyuiPreset()
