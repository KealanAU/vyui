/**
 * Ambient `as const`-grade types for `color-constants.js` so the TS plane
 * narrows the color set to literal unions (rather than `string[]`). The runtime
 * values live in the `.js`; these declarations only describe their literal
 * shape. Keep both files in sync.
 */

export declare const COLORS: readonly ['primary', 'secondary', 'success', 'info', 'warning', 'error']

export declare const NEUTRAL: 'neutral'

export declare const ALL_COLORS: readonly ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral']

export declare const SHADES: readonly [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

export declare const SEMANTIC_TO_PALETTE_DEFAULT: Record<string, string>
