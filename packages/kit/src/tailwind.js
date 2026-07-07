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

/**
 * Extra `ui-*` state markers the kit themes use beyond the lynx preset's
 * built-in set (`open/closed/active/checked/disabled/...`). These back the
 * class-based variants (`ui-on:`, `group-ui-completed:`, etc.) that replace
 * Lynx-incompatible `data-[state=…]` attribute selectors (issue #9). Feed them
 * into the lynx preset's `uiVariants` plugin so it generates the self/group/
 * peer/parent forms:
 *
 * ```ts
 * import { createLynxPreset } from '@lynx-js/tailwind-preset'
 * import { VYUI_UI_STATES } from '@vyui/kit/tailwind'
 * const lynxPreset = createLynxPreset({
 *   lynxUIPlugins: {
 *     uiVariants: { prefixes: (d) => ({ ...d, ui: [...d.ui, ...VYUI_UI_STATES] }) },
 *   },
 * })
 * ```
 */
export const VYUI_UI_STATES = ['on', 'off', 'completed', 'highlighted', 'inactive']

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
 * standard semantic colors.
 *
 * Accepts EITHER the flat preset options (`{ colors, neutral, shades }`) OR a
 * normalized config from `defineVyuiConfig` (`{ ui: { colors } }`) — pass the
 * SAME config object here and to `provideVyUI` so the generated palette and the
 * runtime `ui.colors` can't drift.
 *
 * @param {object} [options] Flat options, or a `defineVyuiConfig` result.
 * @param {string[]} [options.colors] Configurable semantic colors (no neutral).
 * @param {string}   [options.neutral] Neutral color name.
 * @param {number[]} [options.shades] Tailwind shade steps.
 * @param {object}   [options.ui] Normalized config; `ui.colors` overrides `colors`.
 * @returns {Partial<TailwindConfig>}
 */
export function createVyuiPreset(options = {}) {
  // Unwrap the normalized `{ ui }` config from defineVyuiConfig; fall back to
  // the flat `{ colors, neutral, shades }` form for direct callers.
  const src = options.ui ?? options
  const { colors = COLORS, neutral = NEUTRAL, shades = SHADES } = src

  // Silent "class resolves to nothing" is the worst DX here: a semantic color
  // outside the package set generates utilities but only paints if the consumer
  // also defines matching `--ui-color-<name>-*` CSS vars AND lists it in the
  // runtime `theme.colors`. Surface that at build time (dev only — this file
  // runs in Node via Tailwind's jiti loader, so `process.env` is available).
  if (process.env.NODE_ENV !== 'production') {
    const custom = colors.filter((c) => !COLORS.includes(c))
    if (custom.length > 0) {
      console.warn(
        `[vyui/tailwind] custom semantic color(s) [${custom.join(', ')}] will emit `
        + 'utilities, but only resolve if you also define matching '
        + '`--ui-color-<name>-*` CSS vars and list them in your runtime '
        + '`theme.colors` (provideVyUI / app.use). Otherwise the classes paint nothing.',
      )
    }
  }

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
        // State variants the kit themes pair with dynamic color utilities. CSS
        // inheritance is off on Lynx, so state-driven foreground colors live on
        // child text/icon slots and read the parent's state via the `group-*`
        // forms — both self and group forms must be safelisted or the scanner
        // purges them. The `ui-*` class variants replace Lynx-incompatible
        // `data-[state=…]` selectors (issue #9); the `data-[…]` entries remain
        // only for not-yet-migrated themes and can be dropped once #9 lands.
        variants: [
          'hover',
          'active',
          'focus',
          'disabled',
          'ui-highlighted',
          'ui-active',
          'ui-on',
          'ui-open',
          'ui-checked',
          'group-ui-highlighted',
          'group-ui-active',
          'group-ui-completed',
          'group-ui-inactive',
          'group-ui-on',
          'group-ui-open',
          'group-ui-checked',
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
      // Focus/highlight ring — generated as a template literal in
      // `theme/input.ts`; arbitrary values can't be expressed in the regex
      // pattern above, so safelist the exact strings (keep in sync).
      ...allColors.map((c) => `shadow-[0_0_0_2px_var(--ui-color-${c}-200)]`),
      'text-white',
    ],
  }
}

/** Default preset (standard color set). Keeps `presets: [..., vyuiPreset]` working. */
export default createVyuiPreset()
