import type { Config } from 'tailwindcss'

export interface CreateVyuiPresetOptions {
  /** Configurable semantic colors (excludes neutral). Defaults to the package set. */
  colors?: string[]
  /** Neutral color name. */
  neutral?: string
  /** Tailwind shade steps. */
  shades?: number[]
  /**
   * Restrict the theme safelist to these components (`@vyui/kit/theme` export
   * names, e.g. `['button', 'tabs']`). Components they render internally are
   * pulled in automatically. Omit to safelist every packaged theme.
   */
  components?: string[]
  /**
   * Normalized config from `defineVyuiConfig` (`@vyui/kit/config`). When
   * present, `ui.colors` supplies the semantic color set — pass the same object
   * to `provideVyUI` so build + runtime share one source of truth.
   */
  ui?: { colors?: string[] }
}

/**
 * Build the @vyui/kit Tailwind preset. Accepts flat options or a
 * `defineVyuiConfig` result (`{ ui: { colors } }`).
 */
export declare function createVyuiPreset(options?: CreateVyuiPresetOptions): Partial<Config>

/** Default configurable semantic colors (excludes neutral). Literal tuple so
 *  `[...COLORS, 'tertiary']` keeps narrow types — mirrors color-constants.d.ts. */
export declare const COLORS: readonly ['primary', 'secondary', 'success', 'info', 'warning', 'error']
/** Neutral color name. */
export declare const NEUTRAL: 'neutral'

/** Extra `ui-*` state markers (beyond the lynx preset's built-ins) the kit
 *  themes rely on for class-based state variants — feed into `uiVariants`. */
export declare const VYUI_UI_STATES: readonly ['on', 'off', 'completed', 'highlighted', 'inactive', 'dragging']

/** Default preset built with the standard color set. */
declare const preset: Partial<Config>
export default preset
