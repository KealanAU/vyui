/**
 * Checkbox theme — adapted from nuxt/ui v3.0.2 `theme/checkbox.ts` for Vue-Lynx.
 *
 * Classes use semantic color names (`bg-primary-500`) which Tailwind resolves
 * via CSS variables defined in the consuming app — see
 * `apps/examples/ui-demo/src/index.css`.
 */
export default {
  slots: {
    root: 'flex flex-row items-start gap-2',
    base: 'shrink-0 flex flex-row items-center justify-center rounded transition-colors',
    indicator: 'flex flex-row items-center justify-center',
    icon: 'shrink-0 text-white',
    wrapper: 'flex flex-col',
    label: 'text-sm font-medium text-neutral-900',
    description: 'text-xs text-neutral-500',
  },
  variants: {
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    size: {
      sm: { base: 'w-4 h-4 rounded', icon: 'w-3 h-3' },
      md: { base: 'w-5 h-5 rounded', icon: 'w-3.5 h-3.5' },
      lg: { base: 'w-6 h-6 rounded-md', icon: 'w-4 h-4' },
      xl: { base: 'w-7 h-7 rounded-md', icon: 'w-5 h-5' },
    },
    checked: {
      true: {},
      false: { base: 'bg-white border border-neutral-300' },
    },
    disabled: {
      true: { base: 'opacity-50 cursor-not-allowed' },
    },
    highlight: {
      true: '',
    },
  },
  compoundVariants: [
    { color: 'primary' as const, checked: true as const, class: { base: 'bg-primary-500 border border-primary-500' } },
    { color: 'secondary' as const, checked: true as const, class: { base: 'bg-secondary-500 border border-secondary-500' } },
    { color: 'success' as const, checked: true as const, class: { base: 'bg-success-500 border border-success-500' } },
    { color: 'info' as const, checked: true as const, class: { base: 'bg-info-500 border border-info-500' } },
    { color: 'warning' as const, checked: true as const, class: { base: 'bg-warning-500 border border-warning-500' } },
    { color: 'error' as const, checked: true as const, class: { base: 'bg-error-500 border border-error-500' } },
    { color: 'neutral' as const, checked: true as const, class: { base: 'bg-neutral-500 border border-neutral-500' } },
    // `highlight` paints a static border matching the color (no focus needed).
    { color: 'primary' as const, highlight: true, class: { base: 'border-2 border-primary-500' } },
    { color: 'secondary' as const, highlight: true, class: { base: 'border-2 border-secondary-500' } },
    { color: 'success' as const, highlight: true, class: { base: 'border-2 border-success-500' } },
    { color: 'info' as const, highlight: true, class: { base: 'border-2 border-info-500' } },
    { color: 'warning' as const, highlight: true, class: { base: 'border-2 border-warning-500' } },
    { color: 'error' as const, highlight: true, class: { base: 'border-2 border-error-500' } },
    { color: 'neutral' as const, highlight: true, class: { base: 'border-2 border-neutral-500' } },
  ],
  defaultVariants: {
    color: 'primary' as const,
    size: 'md' as const,
  },
}
