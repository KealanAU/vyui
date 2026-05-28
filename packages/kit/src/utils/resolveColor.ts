import twColors from 'tailwindcss/colors'
import type { AppConfig } from '../types'

/**
 * Default semantic-color → Tailwind-palette mapping. Mirrors the CSS-variable
 * defaults in `packages/kit/src/style.css` so the JS-resolved hex matches the
 * `--ui-color-*-500` token that Tailwind class utilities would resolve to.
 *
 * Override path: `appConfig.ui.primary` and `appConfig.ui.gray` are already
 * read for `primary` / `neutral`; if a consumer wires up `success`, `error`,
 * etc. as palette names on `appConfig.ui` we'll pick those up too.
 */
const SEMANTIC_TO_PALETTE_DEFAULT: Record<string, string> = {
  primary: 'green',
  secondary: 'blue',
  success: 'emerald',
  info: 'sky',
  warning: 'amber',
  error: 'red',
  neutral: 'slate',
}

const FALLBACK_HEX = '#64748b' // slate-500

/**
 * Resolve a semantic color (`primary`, `error`, …) plus shade to a literal
 * hex string. Used to color Lynx `<svg>` icons — Lynx's SVG element
 * rasterizes the XML and can't inherit `currentColor`, so the fill has to
 * be baked at render time. Tailwind classes (`text-error-500`) still apply
 * to non-SVG slots; this util is for the icon's `:color` prop.
 *
 * Resolution order:
 *  1. `appConfig.ui[semantic]` (e.g. `appConfig.ui.primary === 'rose'`)
 *  2. `appConfig.ui.gray` when semantic is `neutral`
 *  3. The default palette mapping (matches the package's CSS vars)
 */
export function resolveColorHex(
  appConfig: AppConfig,
  semantic: string | undefined,
  shade: number | string = 500,
): string {
  const name = semantic || 'primary'

  const ui = appConfig.ui as Record<string, unknown>
  let palette = typeof ui[name] === 'string' ? (ui[name] as string) : undefined
  if (!palette && name === 'neutral' && typeof ui.gray === 'string') palette = ui.gray as string
  if (!palette) palette = SEMANTIC_TO_PALETTE_DEFAULT[name] ?? 'slate'

  const scale = (twColors as unknown as Record<string, Record<string, string>>)[palette]
  return scale?.[String(shade)] ?? FALLBACK_HEX
}
