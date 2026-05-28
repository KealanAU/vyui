/**
 * @vyui/kit Tailwind preset.
 *
 * Wires the semantic color names used by every theme file (`bg-primary-500`,
 * `text-error-50`, etc.) to the CSS variables defined in `style.css`. Also
 * pre-safelists the color × shade × utility combinations that the themes
 * generate via template literals (Tailwind's static scanner cannot see them).
 *
 * Plain `.js` (CJS-compatible) so Tailwind's jiti-based config loader can
 * import it through package `exports` on any Node version.
 *
 * Usage:
 * ```ts
 * import vyuiPreset from '@vyui/kit/tailwind'
 * export default {
 *   content: [...],
 *   presets: [lynxPreset, vyuiPreset],
 * }
 * ```
 *
 * @typedef {import('tailwindcss').Config} TailwindConfig
 */

const SEMANTIC_COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
]

const buildScale = (name) => ({
  50: `var(--ui-color-${name}-50)`,
  100: `var(--ui-color-${name}-100)`,
  200: `var(--ui-color-${name}-200)`,
  300: `var(--ui-color-${name}-300)`,
  400: `var(--ui-color-${name}-400)`,
  500: `var(--ui-color-${name}-500)`,
  600: `var(--ui-color-${name}-600)`,
  700: `var(--ui-color-${name}-700)`,
  800: `var(--ui-color-${name}-800)`,
  900: `var(--ui-color-${name}-900)`,
  950: `var(--ui-color-${name}-950)`,
  // Mode-aware shorthand. `neutral` has no `--ui-neutral` (matches Nuxt UI),
  // so skip DEFAULT for it.
  ...(name === 'neutral' ? {} : { DEFAULT: `var(--ui-${name})` }),
})

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

/** @type {Partial<TailwindConfig>} */
const preset = {
  theme: {
    extend: {
      colors: Object.fromEntries(
        SEMANTIC_COLORS.map((name) => [name, buildScale(name)]),
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
        `(bg|text|ring|border)-(${SEMANTIC_COLORS.join('|')})-(50|100|200|300|400|500|600|700|800|900|950)`,
      ),
      variants: [
        'hover',
        'active',
        'focus',
        'disabled',
        'data-[state=on]',
        'data-[state=open]',
        'data-[state=checked]',
        'group-data-[state=active]',
        'group-data-[state=completed]',
      ],
    },
    'text-white',
  ],
}

export default preset
