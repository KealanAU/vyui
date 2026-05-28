/**
 * Switch theme — adapted from nuxt/ui v3.0.2 `theme/switch.ts` for Vue-Lynx.
 *
 * Classes use semantic color names (`bg-primary-500`) which Tailwind resolves
 * via CSS variables defined in the consuming app — see
 * `apps/examples/ui-demo/src/index.css`.
 */
export default {
  slots: {
    root: 'flex flex-row items-center gap-2',
    // `items-center` centers the thumb vertically — without it, the thumb
    // (`h-4` < rail's `h-5`) pins to the cross-axis start (top edge) on Lynx.
    base: 'relative flex flex-row items-center shrink-0 rounded-full transition-colors',
    thumb: 'pointer-events-none flex flex-row items-center justify-center rounded-full bg-white shadow transform transition-transform',
    wrapper: 'flex flex-col',
    label: 'text-sm font-medium text-neutral-900',
    description: 'text-xs text-neutral-500',
    icon: 'shrink-0',
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
      sm: { base: 'w-9 h-5', thumb: 'w-4 h-4', icon: 'size-3' },
      md: { base: 'w-11 h-6', thumb: 'w-5 h-5', icon: 'size-3.5' },
      lg: { base: 'w-12 h-7', thumb: 'w-6 h-6', icon: 'size-4' },
      xl: { base: 'w-14 h-8', thumb: 'w-7 h-7', icon: 'size-5' },
    },
    checked: {
      true: '',
      false: { base: 'bg-neutral-200', thumb: 'translate-x-0.5' },
    },
    disabled: {
      true: { base: 'opacity-50 cursor-not-allowed' },
    },
    highlight: {
      true: '',
    },
    loading: {
      true: { icon: 'animate-spin' },
    },
  },
  compoundVariants: [
    { color: 'primary' as const, checked: true, class: { base: 'bg-primary-500' } },
    { color: 'secondary' as const, checked: true, class: { base: 'bg-secondary-500' } },
    { color: 'success' as const, checked: true, class: { base: 'bg-success-500' } },
    { color: 'info' as const, checked: true, class: { base: 'bg-info-500' } },
    { color: 'warning' as const, checked: true, class: { base: 'bg-warning-500' } },
    { color: 'error' as const, checked: true, class: { base: 'bg-error-500' } },
    { color: 'neutral' as const, checked: true, class: { base: 'bg-neutral-500' } },
    { color: 'primary' as const, highlight: true, class: { base: 'border-2 border-primary-500' } },
    { color: 'secondary' as const, highlight: true, class: { base: 'border-2 border-secondary-500' } },
    { color: 'success' as const, highlight: true, class: { base: 'border-2 border-success-500' } },
    { color: 'info' as const, highlight: true, class: { base: 'border-2 border-info-500' } },
    { color: 'warning' as const, highlight: true, class: { base: 'border-2 border-warning-500' } },
    { color: 'error' as const, highlight: true, class: { base: 'border-2 border-error-500' } },
    { color: 'neutral' as const, highlight: true, class: { base: 'border-2 border-neutral-500' } },
    { size: 'sm' as const, checked: true, class: { thumb: 'translate-x-4' } },
    { size: 'md' as const, checked: true, class: { thumb: 'translate-x-5' } },
    { size: 'lg' as const, checked: true, class: { thumb: 'translate-x-5' } },
    { size: 'xl' as const, checked: true, class: { thumb: 'translate-x-6' } },
  ],
  defaultVariants: {
    color: 'primary' as const,
    size: 'md' as const,
  },
}
