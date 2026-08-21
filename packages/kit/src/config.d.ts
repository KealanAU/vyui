import type { AppConfig, ComponentThemes, DeepPartial } from './types'

/**
 * Authoring shape for a VyUI project config. Pass to {@link defineVyuiConfig},
 * then feed the result to BOTH `createVyuiPreset` (build) and
 * `provideVyUI` / `app.use(VyUI)` (runtime).
 */
export interface VyuiConfig {
  /** Palette + semantic selection. `colors` drives which utilities the Tailwind
   *  preset generates; `primary`/`gray`/`icons` drive runtime variant + icon-hex
   *  resolution. */
  theme?: DeepPartial<Pick<AppConfig['ui'], 'primary' | 'gray' | 'colors' | 'icons'>>
  /** Per-component `tailwind-variants` overrides, keyed by component name.
   *  Runtime-only — selects from classes Tailwind has already emitted. */
  components?: ComponentThemes
}

/** Normalized config consumed by `createVyuiPreset` + `provideVyUI`/`app.use`. */
export interface ResolvedVyuiConfig {
  ui: DeepPartial<AppConfig['ui']>
}

/**
 * Author a VyUI config once and feed the result to both planes so the generated
 * class surface and the runtime variant selection stay in lockstep:
 *
 * ```ts
 * // vyui.config.ts
 * export default defineVyuiConfig({
 *   theme: { primary: 'orange', gray: 'stone' },
 * })
 * ```
 */
export declare function defineVyuiConfig(config?: VyuiConfig): ResolvedVyuiConfig
