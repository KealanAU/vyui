/**
 * @vyui/kit Tailwind preset.
 *
 * Wires the semantic color names used by every theme file (`bg-primary-500`,
 * `text-error-50`, etc.) to the CSS variables defined in `style.css`. Also
 * safelists the EXACT classes the themes emit for the configured color set
 * (collected by walking the packaged tv configs) — the themes build them via
 * template literals, which Tailwind's static scanner cannot see.
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
import * as themeExports from './theme/index.js'

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
export const VYUI_UI_STATES = ['on', 'off', 'completed', 'highlighted', 'inactive', 'dragging']

// Theme-barrel exports that are not tailwind-variants theme configs.
const NON_THEME_EXPORTS = new Set(['icons', 'ALL_COLORS', 'COLORS', 'NEUTRAL', 'resolveColors'])

/**
 * Styled components rendered INSIDE other kit components (the `import Vy*`
 * graph in `src/components`): a consumer safelisting `components: ['button']`
 * must also get `avatar`'s classes (Button renders a leading `VyAvatar`), and
 * so on transitively. Keys/values are `@vyui/kit/theme` export names.
 */
const THEME_DEPS = {
  actionSheet: ['avatar'],
  avatar: ['chip'],
  avatarGroup: ['avatar'],
  badge: ['avatar'],
  button: ['avatar'],
  calendar: ['alert'],
  input: ['avatar'],
  modal: ['button'],
  textarea: ['avatar'],
  toast: ['avatar', 'button'],
}

/** Expand a component list through `THEME_DEPS` to its transitive closure. */
const expandThemeDeps = (names) => {
  const seen = new Set()
  const queue = [...names]
  while (queue.length) {
    const name = queue.pop()
    if (seen.has(name)) continue
    seen.add(name)
    queue.push(...(THEME_DEPS[name] ?? []))
  }
  return seen
}

/** Add every whitespace-separated class token found in a tv class value
 * (string / array / slot-map object) to `into`. */
const collectStrings = (node, into) => {
  if (typeof node === 'string') {
    for (const cls of node.split(/\s+/)) if (cls) into.add(cls)
  }
  else if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, into)
  }
  else if (node && typeof node === 'object') {
    for (const value of Object.values(node)) collectStrings(value, into)
  }
}

/**
 * Collect the EXACT set of class names every packaged theme emits for a given
 * color list, by walking the tv configs (base/slots/variants/compoundVariants
 * — `defaultVariants` holds variant NAMES, not classes). Builder themes are
 * invoked with the resolved colors, so template-literal color classes
 * (`bg-${c}-500`, `group-ui-active:text-${c}-500`, …) come out as concrete
 * strings — the classes Tailwind's static scanner cannot see.
 *
 * This replaces the previous `(bg|text|ring|border) × color × shade × variant`
 * safelist patterns, which emitted every COMBINATION (~11k rules, ~550 KB+ of
 * CSS the device style engine had to ingest) when the themes only ever
 * reference a small fraction.
 */
const collectThemeSafelist = (colors, components) => {
  const only = components ? expandThemeDeps(components) : undefined
  const classes = new Set()
  for (const [name, theme] of Object.entries(themeExports)) {
    if (NON_THEME_EXPORTS.has(name)) continue
    if (only && !only.has(name)) continue
    const config = typeof theme === 'function' ? theme(colors) : theme
    if (!config || typeof config !== 'object') continue
    collectStrings(config.base, classes)
    collectStrings(config.slots, classes)
    for (const group of Object.values(config.variants ?? {})) {
      for (const value of Object.values(group ?? {})) collectStrings(value, classes)
    }
    for (const compound of [...(config.compoundVariants ?? []), ...(config.compoundSlots ?? [])]) {
      collectStrings(compound.class, classes)
      collectStrings(compound.className, classes)
    }
  }
  return [...classes].sort()
}

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
 * @param {string[]} [options.components] Restrict the theme safelist to these
 *   components (`@vyui/kit/theme` export names, e.g. `['button', 'tabs']`).
 *   Components they render internally are pulled in automatically
 *   (`THEME_DEPS`). Omit to safelist every packaged theme.
 * @param {object}   [options.ui] Normalized config; `ui.colors` overrides `colors`.
 * @returns {Partial<TailwindConfig>}
 */
export function createVyuiPreset(options = {}) {
  // Unwrap the normalized `{ ui }` config from defineVyuiConfig; fall back to
  // the flat `{ colors, neutral, shades }` form for direct callers.
  const src = options.ui ?? options
  const { colors = COLORS, neutral = NEUTRAL, shades = SHADES, components } = src

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
    // Same failure mode for a typo'd component name: the filter would silently
    // drop a real theme's classes.
    const unknown = (components ?? []).filter((c) => !(c in themeExports) || NON_THEME_EXPORTS.has(c))
    if (unknown.length > 0) {
      console.warn(
        `[vyui/tailwind] unknown component theme(s) in \`components\`: [${unknown.join(', ')}]. `
        + 'Names must match the `@vyui/kit/theme` exports (e.g. `button`, `actionSheet`).',
      )
    }
  }

  const allColors = [...new Set([...colors, neutral])]
  return {
    // The library flips via semantic tokens under a `.dark` class (not `dark:`
    // utilities), but pin the trigger to `class` so any `dark:` a CONSUMER
    // writes keys off the same `.dark` ancestor `useColorMode` toggles.
    darkMode: 'class',
    theme: {
      extend: {
        colors: Object.fromEntries(
          allColors.map((name) => [name, buildScale(name, neutral, shades)]),
        ),
        // Semantic tokens — role-based utilities wired to the `--ui-*` tokens in
        // `style.css`. Themes (and consumers) use these instead of raw ramp
        // classes, so they flip in dark on their own (each token holds a
        // per-mode `theme()` literal → one-hop var(), Lynx-safe). Scoped to
        // `backgroundColor` / `textColor` / `borderColor` / `divideColor` /
        // `fill` so each name only emits its own utility family.
        //   surfaces: `bg-default` (cards/fields/overlays) + `bg-muted` /
        //   `bg-elevated` / `bg-accented` fills + `bg-inverted` (neutral solid).
        backgroundColor: {
          default: 'var(--ui-bg)',
          muted: 'var(--ui-bg-muted)',
          elevated: 'var(--ui-bg-elevated)',
          accented: 'var(--ui-bg-accented)',
          inverted: 'var(--ui-bg-inverted)',
        },
        // text: `text-default` (body) → `text-highlighted` (emphasis), plus
        // `text-muted` / `text-dimmed` / `text-toned` and `text-inverted` (the
        // foreground for `bg-inverted` fills).
        textColor: {
          default: 'var(--ui-text)',
          dimmed: 'var(--ui-text-dimmed)',
          muted: 'var(--ui-text-muted)',
          toned: 'var(--ui-text-toned)',
          highlighted: 'var(--ui-text-highlighted)',
          inverted: 'var(--ui-text-inverted)',
        },
        // borders: `border-default` + `border-muted` / `border-accented` /
        // `border-inverted`. Lowercase `default` emits `border-default` (a color
        // utility); it does NOT touch the bare `border` (which stays the
        // borderWidth DEFAULT below), so existing `border` usages are unaffected.
        borderColor: {
          default: 'var(--ui-border)',
          muted: 'var(--ui-border-muted)',
          accented: 'var(--ui-border-accented)',
          inverted: 'var(--ui-border-inverted)',
        },
        // `divide-default` / `divide-muted` — dividers ride the border tokens.
        divideColor: {
          default: 'var(--ui-border)',
          muted: 'var(--ui-border-muted)',
        },
        // `fill-default` — SVG fills (e.g. the popover/select arrow) ride the
        // border token so they flip with the surface edge.
        fill: {
          default: 'var(--ui-border)',
        },
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
      // Every class the packaged themes emit for THIS color set — variant
      // prefixes (`active:`, `group-ui-*:`) and arbitrary values
      // (`shadow-[…var(--ui-color-primary-200)]`) included, since they sit in
      // the theme strings themselves. Covers a consumer who only pulls the
      // preset without scanning `@vyui/kit` sources.
      ...collectThemeSafelist(allColors, components),
      // Semantic tokens — role-based utilities (`text-muted`, `bg-elevated`,
      // `border-default`, …) kept as a pattern (not just the themes' usages)
      // so consumers can write any of them without scanning the kit. The
      // pattern over-matches (e.g. `text-elevated`) but Tailwind only emits
      // names backed by a real utility.
      {
        pattern: /(bg|text|border)-(default|muted|elevated|accented|toned|dimmed|highlighted|inverted)/,
      },
      'divide-default',
      'divide-muted',
      'fill-default',
      'text-white',
    ],
  }
}

/** Default preset (standard color set). Keeps `presets: [..., vyuiPreset]` working. */
export default createVyuiPreset()
