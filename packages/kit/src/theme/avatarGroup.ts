// Ported from nuxt/ui v4 `src/theme/avatar-group.ts` — see `./button.ts` for the
// shared Lynx adaptations. Two more, both load-bearing here:
//   - `ring-bg` becomes `ring-white`. vyui ships dark via semantic tokens, so the
//     upstream page-background semantic has no equivalent.
//   - `inline-flex` becomes an explicit `flex`. `@lynx-js/tailwind-preset` strips
//     `inline-flex`, and without `flex` a `<view>` falls back to Lynx's default
//     `linear` layout: `flex-row-reverse` is ignored and the avatars stack
//     vertically instead of overlapping.
//
// `flex-row-reverse` keeps the upstream stacking trick — avatars render in
// reverse order, so the first child paints on top by source order.
import type { Color } from './colors'

export default (colors: Color[]) => ({
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
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
  },
  defaultVariants: {
    size: 'md' as const,
    color: 'neutral' as const,
  },
})
