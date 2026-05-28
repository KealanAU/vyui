/**
 * Rating theme — styled wrapper over `@vyui/core`'s `RatingRoot` /
 * `RatingItem` / `RatingItemIndicator` primitives.
 *
 * Classes use semantic color names (`text-warning-500`) which Tailwind resolves
 * via CSS variables defined in the consuming app — see
 * `apps/examples/ui-demo/src/index.css`.
 *
 * The filled vs. empty state is driven by the `data-state="active"` attribute
 * core emits on each `RatingItemIndicator` — see `RatingItemIndicator.vue`.
 */
export default {
  slots: {
    root: 'flex flex-row items-center gap-1',
    base: 'shrink-0',
    icon: 'text-neutral-300',
  },
  variants: {
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: '',
    },
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
    { color: 'primary' as const, class: { icon: 'data-[state=active]:text-primary-500' } },
    { color: 'secondary' as const, class: { icon: 'data-[state=active]:text-secondary-500' } },
    { color: 'success' as const, class: { icon: 'data-[state=active]:text-success-500' } },
    { color: 'info' as const, class: { icon: 'data-[state=active]:text-info-500' } },
    { color: 'warning' as const, class: { icon: 'data-[state=active]:text-warning-500' } },
    { color: 'error' as const, class: { icon: 'data-[state=active]:text-error-500' } },
    { color: 'neutral' as const, class: { icon: 'data-[state=active]:text-neutral-500' } },
  ],
  defaultVariants: {
    color: 'warning' as const,
    size: 'md' as const,
  },
}
