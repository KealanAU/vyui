// Ported from nuxt/ui v3.0.2 `src/theme/pin-input.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config — see
// `apps/examples/kit-demo/src/index.css`.
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'relative flex flex-row flex-wrap items-center min-w-0 max-w-full gap-1.5 overflow-hidden',
    base: 'shrink-0 rounded-md placeholder:text-neutral-400 text-center text-neutral-900 disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
  },
  variants: {
    size: {
      sm: { base: 'size-8 text-sm' },
      md: { base: 'size-9 text-sm' },
      lg: { base: 'size-10 text-base' },
      xl: { base: 'size-11 text-lg' },
    },
    variant: {
      outline: 'bg-white border',
      soft: 'bg-neutral-100/50 active:bg-neutral-100 disabled:bg-neutral-100/50',
      subtle: 'bg-neutral-100 border',
      ghost: 'bg-transparent active:bg-neutral-100 disabled:bg-transparent',
      none: 'bg-transparent',
    },
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    highlight: {
      true: '',
    },
  },
  compoundVariants: [
    // outline / subtle border colors per semantic color.
    ...colors.map(color => ({
      color,
      variant: ['outline' as const, 'subtle' as const],
      class: `border-${color}-300`,
    })),
    // `highlight` paints a static border matching the color (no focus needed).
    ...colors.map(color => ({
      color,
      highlight: true,
      class: `border border-${color}-500`,
    })),
  ],
  defaultVariants: {
    size: 'md' as const,
    color: 'primary' as const,
    variant: 'outline' as const,
  },
})
