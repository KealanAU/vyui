/**
 * Semantic color tokens exposed to component `color` variants. These names
 * resolve to Tailwind color scales via CSS variables at runtime (mirrors the
 * nuxt/ui v3 convention). The CSS layer that maps `--ui-color-primary-500` →
 * an actual tailwind scale is generated separately and not part of this file.
 */
export const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export type Color = typeof COLORS[number]
