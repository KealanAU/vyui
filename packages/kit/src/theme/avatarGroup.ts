// Ported from nuxt/ui v4 `src/theme/avatar-group.ts` and adapted for Vue-Lynx.
//
// Two Lynx-specific adaptations:
//   - `ring-bg` (a Nuxt UI semantic that resolves to the page background) is
//     replaced with `ring-white` since vyui ships light-mode-only.
//   - `inline-flex` is replaced with `flex`. The `@lynx-js/tailwind-preset`
//     strips `inline-flex` (Lynx's `display` accepts only `none`, `flex`,
//     `grid`, `linear`). Without explicit `flex`, `<view>` falls back to
//     Lynx's default `linear` layout (vertical) and `flex-row-reverse` is
//     ignored — avatars stack top-to-bottom instead of overlapping inline.
//
// `flex-row-reverse` keeps the upstream stacking trick: avatars rendered in
// reverse order so the first child paints on top via natural source order.

const COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

type SemanticColor = typeof COLORS[number]

export default {
  slots: {
    root: 'flex flex-row-reverse justify-end items-center',
    base: 'relative rounded-full border-white first:me-0',
  },
  variants: {
    size: {
      'xs': { base: 'border-2 -me-1.5' },
      'sm': { base: 'border-2 -me-1.5' },
      'md': { base: 'border-2 -me-2' },
      'lg': { base: 'border-2 -me-2' },
      'xl': { base: 'border-2 -me-2' },
      '2xl': { base: 'border-2 -me-2.5' },
      '3xl': { base: 'border-2 -me-3' },
    },
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
  },
  defaultVariants: {
    size: 'md' as const,
    color: 'neutral' as const,
  },
}
