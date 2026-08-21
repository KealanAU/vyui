// Explicit `.js` — `tailwindcss/colors` has no `exports` map, so the
// extensionless specifier resolves under bundlers but throws under Node's pure
// ESM resolver (which the packed-tarball smoke test uses). The `.js` form works
// everywhere.
import twColors from 'tailwindcss/colors.js'
import type { AppConfig } from '../types'
import { SEMANTIC_TO_PALETTE_DEFAULT } from '../theme/color-constants'

const FALLBACK_HEX = '#64748b' // slate-500

/**
 * Resolve a semantic color (`primary`, `error`, …) plus shade to a literal hex
 * string, for coloring Lynx `<svg>` icons — Lynx rasterizes the XML and can't
 * inherit `currentColor`, so the fill is baked at render time. Tailwind classes
 * still apply to non-SVG slots; this is for the icon's `:color` prop.
 *
 * Resolution order: `appConfig.ui[semantic]`, then `appConfig.ui.gray` for
 * `neutral`, then the default palette mapping.
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

  const scale = (twColors as unknown as Record<string, Record<string, string> | string>)[palette]
  // `black` / `white` are single strings in `tailwindcss/colors`, not 11-shade
  // scales, so every shade resolves to the one value. Without this a monochrome
  // accent silently fell back to slate-500 for baked SVG fills.
  if (typeof scale === 'string') return scale
  return scale?.[String(shade)] ?? FALLBACK_HEX
}
