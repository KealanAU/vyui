// Ported from nuxt/ui v3.0.2 `src/theme/pin-input.ts` — see `./button.ts` for
// the shared Lynx adaptations.
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'relative flex flex-row flex-wrap items-center min-w-0 max-w-full gap-1.5 overflow-hidden',
    base: 'shrink-0 rounded-md placeholder:text-dimmed text-center text-highlighted disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
  },
  variants: {
    size: {
      sm: { base: 'size-8 text-sm' },
      md: { base: 'size-9 text-sm' },
      lg: { base: 'size-10 text-base' },
      xl: { base: 'size-11 text-lg' },
    },
    variant: {
      outline: 'bg-default border border-default',
      soft: 'bg-muted active:bg-elevated disabled:bg-muted',
      subtle: 'bg-elevated border border-default',
      ghost: 'bg-transparent active:bg-elevated disabled:bg-transparent',
      none: 'bg-transparent',
    },
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    highlight: {
      true: '',
    },
  },
  compoundVariants: [
    // Resting border is neutral; the colored border is opt-in via `highlight`
    // (no focus state on Lynx).
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
