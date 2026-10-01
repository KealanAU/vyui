/**
 * @vyui/kit Tailwind preset.
 *
 * Wires the semantic color names used by every theme file (`bg-primary-500`,
 * `text-error-50`, …) to the CSS variables in `style.css`, and safelists the
 * EXACT classes the themes emit for the configured color set (collected by
 * walking the packaged tv configs) — the themes build them via template
 * literals, which Tailwind's static scanner cannot see.
 *
 * Plain `.js` (CJS-compatible) so Tailwind's jiti-based config loader can import
 * it through package `exports` on any Node version. The color list is shared
 * with the TS/runtime plane via `./theme/color-constants.js`.
 *
 * @typedef {import('tailwindcss').Config} TailwindConfig
 */

import { COLORS, NEUTRAL, SHADES } from './theme/color-constants.js'
// Explicit `.ts` so the source plane resolves under jiti (jiti's CJS resolver
// won't remap `.js` → `.ts`). Vite rewrites this to `./theme/index.js` in dist.
import * as themeExports from './theme/index.ts'

// Re-exported so a Tailwind config can extend the default set without pulling
// the component barrel (`@vyui/kit`) through jiti.
export { COLORS, NEUTRAL } from './theme/color-constants.js'

/**
 * Extra `ui-*` state markers the kit themes use beyond the lynx preset's
 * built-in set. These back the class-based variants (`ui-on:`,
 * `group-ui-completed:`, …) that replace Lynx-incompatible `data-[state=…]`
 * attribute selectors (issue #9). Feed them into the lynx preset's `uiVariants`
 * plugin so it generates the self/group/peer/parent forms.
 */
export const VYUI_UI_STATES = ['on', 'off', 'completed', 'highlighted', 'inactive', 'dragging']

// Theme-barrel exports that are not tailwind-variants theme configs.
const NON_THEME_EXPORTS = new Set(['icons', 'ALL_COLORS', 'COLORS', 'NEUTRAL', 'resolveColors'])

/**
 * Styled components rendered INSIDE other kit components: safelisting
 * `components: ['button']` must also pull in `avatar` (Button renders a leading
 * `VyAvatar`), transitively. Keys/values are `@vyui/kit/theme` export names.
 */
const THEME_DEPS = {
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
 * color list, by walking the tv configs (base/slots/variants/compoundVariants —
 * `defaultVariants` holds variant NAMES, not classes). Builder themes are
 * invoked with the resolved colors, so template-literal color classes come out
 * as concrete strings. Replaces `(bg|text|ring|border) × color × shade ×
 * variant` safelist patterns, which emitted ~11k rules for a fraction of use.
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
 * Border-radius scale wired to `--ui-radius` (defined in `style.css`), mirroring
 * nuxt/ui v3's ratios. `none` and `full` keep Tailwind's defaults.
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
 * Build the @vyui/kit preset for a given color set.
 *
 * Accepts EITHER the flat preset options (`{ colors, neutral, shades }`) OR the
 * runtime config bag (`{ ui }`) — pass the SAME config object here and to
 * `provideVyUI` so palette and runtime `ui.colors` can't drift.
 *
 * @param {object} [options] Flat options, or a `{ ui }` runtime config.
 * @param {string[]} [options.colors] Configurable semantic colors (no neutral).
 * @param {string}   [options.neutral] Neutral color name.
 * @param {number[]} [options.shades] Tailwind shade steps.
 * @param {string[]} [options.components] Restrict the theme safelist to these
 *   components; components they render internally are pulled in automatically.
 * @param {object}   [options.ui] Runtime config bag; `ui.colors` overrides `colors`.
 * @returns {Partial<TailwindConfig>}
 */
export function createVyuiPreset(options = {}) {
  // Unwrap the shared `{ ui }` runtime config; fall back to the flat form for
  // direct callers.
  const src = options.ui ?? options
  const { colors = COLORS, neutral = NEUTRAL, shades = SHADES, components } = src

  // A semantic color outside the package set generates utilities but only
  // paints if the consumer also defines matching `--ui-color-<name>-*` vars AND
  // lists it in the runtime `theme.colors`. Surface that at build time.
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
        + 'Names must match the `@vyui/kit/theme` exports (e.g. `button`, `drawer`).',
      )
    }
  }

  const allColors = [...new Set([...colors, neutral])]
  return {
  // The library flips via semantic tokens under a `.dark` class, but pin the
  // trigger to `class` so a CONSUMER's `dark:` keys off the same ancestor.
    darkMode: 'class',
    theme: {
      extend: {
        colors: Object.fromEntries(
          allColors.map((name) => [name, buildScale(name, neutral, shades)]),
        ),
        // Semantic tokens — role-based utilities wired to the `--ui-*` tokens in
        // `style.css`. Each token holds a per-mode `theme()` literal → one-hop
        // var(), which is all Lynx resolves. Scoped per utility family so each
        // name only emits its own.
        backgroundColor: {
          default: 'var(--ui-bg)',
          muted: 'var(--ui-bg-muted)',
          elevated: 'var(--ui-bg-elevated)',
          accented: 'var(--ui-bg-accented)',
          inverted: 'var(--ui-bg-inverted)',
        },
        // text: `text-default` (body) → `text-highlighted`, plus `text-muted` /
        // `text-dimmed` / `text-toned` / `text-inverted`.
        textColor: {
          default: 'var(--ui-text)',
          dimmed: 'var(--ui-text-dimmed)',
          muted: 'var(--ui-text-muted)',
          toned: 'var(--ui-text-toned)',
          highlighted: 'var(--ui-text-highlighted)',
          inverted: 'var(--ui-text-inverted)',
        },
        // borders: lowercase `default` emits `border-default` (a color utility);
        // it does NOT touch the bare `border`, which stays the borderWidth
        // DEFAULT below.
        borderColor: {
          default: 'var(--ui-border)',
          muted: 'var(--ui-border-muted)',
          accented: 'var(--ui-border-accented)',
          inverted: 'var(--ui-border-inverted)',
        },
        divideColor: {
          default: 'var(--ui-border)',
          muted: 'var(--ui-border-muted)',
        },
        // `fill-default` — SVG fills ride the border token so they flip with
        // the surface edge.
        fill: {
          default: 'var(--ui-border)',
        },
        borderRadius: RADIUS_SCALE,
        // Halve every numeric step of the borderWidth scale so the project's
        // stroke weight reads thinner without rewriting components. `border-0`
        // and `border-8` keep stock values.
        borderWidth: {
          DEFAULT: '0.5px',
          2: '1px',
          4: '2px',
        },
      },
    },
    safelist: [
      // Every class the packaged themes emit for THIS color set, variant
      // prefixes and arbitrary values included. Covers a consumer who pulls the
      // preset without scanning `@vyui/kit` sources.
      ...collectThemeSafelist(allColors, components),
      // Semantic tokens kept as a pattern (not just the themes' usages) so
      // consumers can write any of them without scanning the kit. Over-matches,
      // but Tailwind only emits names backed by a real utility.
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
