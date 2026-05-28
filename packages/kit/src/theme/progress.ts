/**
 * Progress theme — adapted from nuxt/ui v3.0.2 `theme/progress.ts` for Vue-Lynx.
 *
 * Classes use semantic color names (`bg-primary-500`) which Tailwind resolves
 * via CSS variables defined in the consuming app — see
 * `apps/examples/ui-demo/src/index.css`.
 *
 * Bar variant only — Nuxt UI's circular progress relies on inline SVG which
 * Lynx does not render. The `data-[state=indeterminate]:animate-*` keyframe
 * references are retained; the consuming app must declare matching
 * `carousel`, `carousel-vertical`, `carousel-inverse`, `swing`, `elastic`
 * keyframes in its Tailwind config (or skip indeterminate animations).
 */
const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

type SemanticColor = typeof COLORS[number]

export default {
  slots: {
    root: 'gap-2',
    base: 'relative overflow-hidden rounded-full bg-neutral-100',
    indicator: 'rounded-full size-full transition-transform duration-200 ease-out',
    status: 'flex flex-row justify-end text-neutral-500 transition-[width] duration-200',
    steps: 'grid items-end',
    step: 'truncate text-end row-start-1 col-start-1 transition-opacity',
  },
  variants: {
    animation: {
      'carousel': '',
      'carousel-inverse': '',
      'swing': '',
      'elastic': '',
    },
    color: {
      ...Object.fromEntries(COLORS.filter(c => c !== 'neutral').map(c => [c, {
        indicator: `bg-${c}-500`,
        steps: `text-${c}-500`,
      }])),
      neutral: {
        indicator: 'bg-neutral-900',
        steps: 'text-neutral-900',
      },
    } as Record<SemanticColor, { indicator: string, steps: string }>,
    size: {
      'xs': { status: 'text-xs', steps: 'text-xs' },
      'sm': { status: 'text-sm', steps: 'text-sm' },
      'md': { status: 'text-sm', steps: 'text-sm' },
      'lg': { status: 'text-base', steps: 'text-base' },
      'xl': { status: 'text-base', steps: 'text-base' },
      '2xl': { status: 'text-lg', steps: 'text-lg' },
    },
    step: {
      active: { step: 'opacity-100' },
      first: { step: 'opacity-100 text-neutral-700' },
      other: { step: 'opacity-0' },
      last: { step: '' },
    },
    orientation: {
      horizontal: {
        root: 'w-full flex flex-col',
        base: 'w-full',
        status: 'flex-row',
      },
      vertical: {
        root: 'h-full flex flex-row-reverse',
        base: 'h-full',
        status: 'flex-col',
      },
    },
    inverted: {
      true: { status: 'self-end' },
    },
  },
  compoundVariants: [
    { inverted: true, orientation: 'horizontal' as const, class: { step: 'text-start', status: 'flex-row-reverse' } },
    { inverted: true, orientation: 'vertical' as const, class: { steps: 'items-start', status: 'flex-col-reverse' } },
    { orientation: 'horizontal' as const, size: 'xs' as const, class: 'h-0.5' },
    { orientation: 'horizontal' as const, size: 'sm' as const, class: 'h-1' },
    { orientation: 'horizontal' as const, size: 'md' as const, class: 'h-2' },
    { orientation: 'horizontal' as const, size: 'lg' as const, class: 'h-3' },
    { orientation: 'horizontal' as const, size: 'xl' as const, class: 'h-4' },
    { orientation: 'horizontal' as const, size: '2xl' as const, class: 'h-5' },
    { orientation: 'vertical' as const, size: 'xs' as const, class: 'w-0.5' },
    { orientation: 'vertical' as const, size: 'sm' as const, class: 'w-1' },
    { orientation: 'vertical' as const, size: 'md' as const, class: 'w-2' },
    { orientation: 'vertical' as const, size: 'lg' as const, class: 'w-3' },
    { orientation: 'vertical' as const, size: 'xl' as const, class: 'w-4' },
    { orientation: 'vertical' as const, size: '2xl' as const, class: 'w-5' },
    {
      orientation: 'horizontal' as const,
      animation: 'carousel' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[carousel_2s_ease-in-out_infinite]' },
    },
    {
      orientation: 'vertical' as const,
      animation: 'carousel' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[carousel-vertical_2s_ease-in-out_infinite]' },
    },
    {
      orientation: 'horizontal' as const,
      animation: 'carousel-inverse' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[carousel-inverse_2s_ease-in-out_infinite]' },
    },
    {
      orientation: 'vertical' as const,
      animation: 'carousel-inverse' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[carousel-inverse-vertical_2s_ease-in-out_infinite]' },
    },
    {
      orientation: 'horizontal' as const,
      animation: 'swing' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[swing_2s_ease-in-out_infinite]' },
    },
    {
      orientation: 'vertical' as const,
      animation: 'swing' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[swing-vertical_2s_ease-in-out_infinite]' },
    },
    {
      orientation: 'horizontal' as const,
      animation: 'elastic' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[elastic_2s_ease-in-out_infinite]' },
    },
    {
      orientation: 'vertical' as const,
      animation: 'elastic' as const,
      class: { indicator: 'data-[state=indeterminate]:animate-[elastic-vertical_2s_ease-in-out_infinite]' },
    },
  ],
  defaultVariants: {
    animation: 'carousel' as const,
    color: 'primary' as const,
    size: 'md' as const,
  },
}
