/**
 * Checkbox theme — adapted from nuxt/ui v3.0.2 `theme/checkbox.ts` for Vue-Lynx.
 *
 * Classes use semantic color names (`bg-primary-500`) which Tailwind resolves
 * via CSS variables defined in the consuming app — see
 * `apps/examples/kit-demo/src/index.css`.
 */
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'flex flex-row items-start min-w-0 max-w-full gap-2',
    base: 'shrink-0 flex flex-row items-center justify-center rounded transition-colors',
    indicator: 'flex flex-row items-center justify-center',
    icon: 'shrink-0 text-white',
    wrapper: 'flex-1 min-w-0 flex flex-col',
    label: 'text-sm font-medium text-neutral-900',
    description: 'text-xs text-neutral-500',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, {}])) as Record<Color, object>,
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
    ...colors.map(c => ({ color: c, checked: true as const, class: { base: `bg-${c}-500 border border-${c}-500` } })),
    // `highlight` paints a static border matching the color (no focus needed).
    ...colors.map(c => ({ color: c, highlight: true, class: { base: `border-2 border-${c}-500` } })),
  ],
  defaultVariants: {
    color: 'primary' as const,
    size: 'md' as const,
  },
})
