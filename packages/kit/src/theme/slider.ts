// Ported from nuxt/ui v3.0.2 `src/theme/slider.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config — see
// `apps/examples/kit-demo/src/index.css`.

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
    // `root` direction is set per orientation variant (flex-row default,
    // flex-col vertical).
    root: 'relative flex items-center select-none touch-none',
    track: 'relative bg-neutral-200 overflow-hidden rounded-full grow',
    range: 'absolute rounded-full',
    thumb: 'rounded-full bg-white border-2',
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
    size: {
      sm: { thumb: 'size-4' },
      md: { thumb: 'size-4.5' },
      lg: { thumb: 'size-5' },
      xl: { thumb: 'size-6' },
    },
    orientation: {
      horizontal: {
        root: 'w-full flex-row',
        range: 'h-full',
      },
      vertical: {
        root: 'flex-col h-full',
        range: 'w-full',
      },
    },
    disabled: {
      true: { root: 'opacity-75 cursor-not-allowed' },
    },
  },
  compoundVariants: [
    // color -> concrete range/thumb classes
    ...COLORS.map(color => ({
      color,
      class: {
        range: `bg-${color}-500`,
        thumb: `border-${color}-500`,
      },
    })),
    // orientation x size -> track thickness
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
}
