/**
 * Rating theme — styled wrapper over `@vyui/core`'s `RatingRoot` /
 * `RatingItem` / `RatingItemIndicator` primitives.
 *
 * Classes use semantic color names (`text-warning-500`) which Tailwind resolves
 * via CSS variables defined in the consuming app — see
 * `apps/examples/kit-demo/src/index.css`.
 *
 * The filled vs. empty state is driven by the `data-state="active"` attribute
 * core emits on each `RatingItemIndicator` — see `RatingItemIndicator.vue`.
 */
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'flex flex-row items-center gap-1',
    base: 'shrink-0',
    icon: 'text-neutral-300',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    size: {
      sm: { icon: 'size-5' },
      md: { icon: 'size-6' },
      lg: { icon: 'size-7' },
      xl: { icon: 'size-8' },
    },
    disabled: {
      true: { base: 'opacity-50 cursor-not-allowed' },
    },
  },
  compoundVariants: [
    ...colors.map(c => ({ color: c, class: { icon: `ui-active:text-${c}-500` } })),
  ],
  defaultVariants: {
    color: 'warning' as const,
    size: 'md' as const,
  },
})
