/**
 * Semantic color tokens exposed to component `color` variants, resolved to
 * Tailwind scales via CSS variables at runtime (nuxt/ui v3 convention). The raw
 * constants live in `./color-constants` (plain `.js`, shared with the
 * build-time `tailwind.js` plane); this module adds the runtime `resolveColors`
 * helper and the public `Color` type.
 */
import type { AppConfig } from '../types'
import { ALL_COLORS, COLORS, NEUTRAL } from './color-constants'

export { ALL_COLORS, COLORS, NEUTRAL }

/**
 * Type-level registry of every color a component `color` prop accepts. An
 * `interface` precisely so consumers can extend it via module augmentation (the
 * vue-router `RouteNamedMap` pattern) and get added colors autocompleting
 * everywhere with no build plugin. The default members mirror `ALL_COLORS`.
 * Pair with the runtime (`appConfig.ui.colors`), Tailwind
 * (`createVyuiPreset({ colors })`) and CSS-var steps — see the docs.
 */
export interface VyuiColorRegistry {
  primary: true
  secondary: true
  success: true
  info: true
  warning: true
  error: true
  neutral: true
}

/** Public union of every color a component `color` prop accepts. Derived from
 *  `VyuiColorRegistry`, so consumer augmentation flows through to every prop. */
export type Color = keyof VyuiColorRegistry

/**
 * Resolve the active color list from app config, falling back to `COLORS`, then
 * always appending `neutral` (kept out of the configurable list — nuxt/ui
 * parity) and de-duplicating.
 */
export function resolveColors(appConfig: AppConfig): Color[] {
  const configured = appConfig.ui.colors ?? COLORS
  // Typed as the default `Color` union so theme builders' compoundVariants
  // `color` field matches the color-variant keys under `tv`. Runtime-added
  // custom colors still flow through.
  return [...new Set([...configured, NEUTRAL])] as Color[]
}
