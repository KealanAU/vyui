import type { Config } from 'tailwindcss'

export interface CreateVyuiPresetOptions {
  /** Configurable semantic colors (excludes neutral). Defaults to the package set. */
  colors?: string[]
  /** Neutral color name. */
  neutral?: string
  /** Tailwind shade steps. */
  shades?: number[]
}

/** Build the @vyui/kit Tailwind preset for a given color set. */
export declare function createVyuiPreset(options?: CreateVyuiPresetOptions): Partial<Config>

/** Default configurable semantic colors (excludes neutral). Literal tuple so
 *  `[...COLORS, 'tertiary']` keeps narrow types — mirrors color-constants.d.ts. */
export declare const COLORS: readonly ['primary', 'secondary', 'success', 'info', 'warning', 'error']
/** Neutral color name. */
export declare const NEUTRAL: 'neutral'

/** Default preset built with the standard color set. */
declare const preset: Partial<Config>
export default preset
