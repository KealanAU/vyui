/**
 * Switch theme — adapted from nuxt/ui v3.0.2 `theme/switch.ts` for Vue-Lynx.
 *
 * Classes use semantic color names (`bg-primary-500`) which Tailwind resolves
 * via CSS variables defined in the consuming app — see
 * `apps/examples/kit-demo/src/index.css`.
 */
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'flex flex-row items-center min-w-0 max-w-full gap-2',
    // `items-center` centers the thumb vertically — without it, the thumb
    // (`h-4` < rail's `h-5`) pins to the cross-axis start (top edge) on Lynx.
    //
    // Thumb position is driven by flexbox justification (`justify-start` /
    // `justify-end` via the `checked` variant), NOT `translate-x-*`. The Lynx
    // tailwind preset compiles `translate-x-*` to `transform: translate3d(var(…))`,
    // and `transform`/`var()` positioning silently fails to paint on Lynx —
    // see the canonical write-up in `core/src/components/Slider/SliderThumbImpl.vue`.
    // `px-0.5` keeps the thumb off the rail edges at both ends.
    base: 'relative flex flex-row items-center justify-start shrink-0 px-0.5 rounded-full transition-colors',
    thumb: 'pointer-events-none flex flex-row items-center justify-center rounded-full bg-white shadow',
    wrapper: 'flex-1 min-w-0 flex flex-col',
    label: 'text-sm font-medium text-neutral-900',
    description: 'text-xs text-neutral-500',
    icon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    size: {
      sm: { base: 'w-9 h-5', thumb: 'w-4 h-4', icon: 'size-3' },
      md: { base: 'w-11 h-6', thumb: 'w-5 h-5', icon: 'size-3.5' },
      lg: { base: 'w-12 h-7', thumb: 'w-6 h-6', icon: 'size-4' },
      xl: { base: 'w-14 h-8', thumb: 'w-7 h-7', icon: 'size-5' },
    },
    checked: {
      true: { base: 'justify-end' },
      false: { base: 'bg-neutral-200' },
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
    ...colors.map(c => ({ color: c, checked: true, class: { base: `bg-${c}-500` } })),
    ...colors.map(c => ({ color: c, highlight: true, class: { base: `border-2 border-${c}-500` } })),
  ],
  defaultVariants: {
    color: 'primary' as const,
    size: 'md' as const,
  },
})
