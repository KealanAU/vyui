// Ported from nuxt/ui v3.0.2 `src/theme/slider.ts` — see `./button.ts` for the
// shared Lynx adaptations.
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    // `root` direction is set per orientation variant (flex-row default,
    // flex-col vertical).
    root: 'relative flex items-center select-none touch-none',
    track: 'relative bg-accented overflow-hidden rounded-full grow',
    range: 'absolute rounded-full',
    thumb: 'rounded-full bg-white border-2',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    size: {
      sm: { thumb: 'size-4' },
      // 18px, not `size-4.5` — Tailwind v3's spacing scale has no 4.5 step, so
      // that class compiled to nothing and the default thumb rendered 0×0.
      md: { thumb: 'size-[18px]' },
      lg: { thumb: 'size-5' },
      xl: { thumb: 'size-6' },
    },
    orientation: {
      // Cross-axis padding IS the touch target — the thumb is absolutely
      // positioned, so the root is otherwise as thin as the track. Padding
      // rather than a height/width because the drag measures the root's
      // main-axis extent, which cross-axis padding leaves alone.
      horizontal: {
        root: 'w-full flex-row py-2',
        range: 'h-full',
      },
      vertical: {
        root: 'flex-col h-full px-2',
        range: 'w-full',
      },
    },
    disabled: {
      true: { root: 'opacity-75 cursor-not-allowed' },
    },
  },
  compoundVariants: [
    ...colors.map(color => ({
      color,
      class: {
        range: `bg-${color}-500`,
        thumb: `border-${color}-500`,
      },
    })),
    { orientation: 'horizontal' as const, size: 'sm' as const, class: { track: 'h-[8px]' } },
    { orientation: 'horizontal' as const, size: 'md' as const, class: { track: 'h-[9px]' } },
    { orientation: 'horizontal' as const, size: 'lg' as const, class: { track: 'h-[10px]' } },
    { orientation: 'horizontal' as const, size: 'xl' as const, class: { track: 'h-[12px]' } },
    { orientation: 'vertical' as const, size: 'sm' as const, class: { track: 'w-[8px]' } },
    { orientation: 'vertical' as const, size: 'md' as const, class: { track: 'w-[9px]' } },
    { orientation: 'vertical' as const, size: 'lg' as const, class: { track: 'w-[10px]' } },
    { orientation: 'vertical' as const, size: 'xl' as const, class: { track: 'w-[12px]' } },
  ],
  defaultVariants: {
    size: 'md' as const,
    color: 'primary' as const,
    orientation: 'horizontal' as const,
  },
})
