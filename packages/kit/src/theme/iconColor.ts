// Bake-time icon-color resolution, shared by the component themes.
//
// Lynx rasterizes each `<svg>`, so a `text-*` class on an icon slot never
// reaches the glyph — the fill is baked into the SVG via the Icon `color` prop
// (`resolveColorHex`). This maps the foreground CLASS a theme emits to a
// `{ semantic, shade }` descriptor for that resolver.
//
// Accent classes (`text-primary-600`) are mode-independent — the accent ramps
// don't invert. Semantic TOKENS (`text-muted`, …) resolve to different neutral
// shades in light vs dark, so callers pass the live `isDark` and the baked fill
// tracks the mode the way the CSS token would.

export type IconFg = { semantic: string, shade: number } | 'white'

const N = (shade: number): IconFg => ({ semantic: 'neutral', shade })

// suffix (the part after `text-`) → per-mode neutral fill. Mirrors the
// `--ui-text-*` values in `style.css` (light `:root`, dark `.dark`).
const SEMANTIC_TOKEN: Record<string, { light: IconFg, dark: IconFg }> = {
  highlighted: { light: N(900), dark: 'white' },
  default: { light: N(700), dark: N(200) },
  toned: { light: N(600), dark: N(300) },
  muted: { light: N(500), dark: N(400) },
  dimmed: { light: N(400), dark: N(500) },
  inverted: { light: 'white', dark: N(900) },
}

/**
 * Resolve an icon fill from a foreground class SUFFIX (the token after `text-`),
 * mode-aware. Returns `'white'` for `text-white`, unknown suffixes, and the
 * token ends that are white in `isDark`.
 */
export function iconFgFromToken(suffix: string | undefined, isDark: boolean): IconFg {
  if (!suffix || suffix === 'white')
    return 'white'
  // accent ramp: `{color}-{shade}` (ramp not inverted → mode-independent)
  const accent = suffix.match(/^([a-z]+)-(\d+)$/)
  if (accent)
    return { semantic: accent[1], shade: Number(accent[2]) }
  const token = SEMANTIC_TOKEN[suffix]
  return token ? token[isDark ? 'dark' : 'light'] : 'white'
}
