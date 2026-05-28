/**
 * Separator theme — adapted from nuxt/ui v3.0.2 `theme/separator.ts` for Vue-Lynx.
 *
 * Classes use semantic color names (`border-primary-500`) which Tailwind
 * resolves via CSS variables defined in the consuming app — see
 * `apps/examples/ui-demo/src/index.css`. The Nuxt UI `avatar` slot is dropped
 * (Vy UI's Avatar isn't a separator concern); `label` and `icon` are retained.
 */
const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

type SemanticColor = typeof COLORS[number]

export default {
  slots: {
    // `root` direction is set per orientation variant (flex-row/flex-col).
    root: 'flex items-center text-center',
    border: '',
    container: 'font-medium text-neutral-900 flex flex-row',
    icon: 'shrink-0 size-5',
    label: 'text-sm',
  },
  variants: {
    color: {
      ...Object.fromEntries(COLORS.filter(c => c !== 'neutral').map(c => [c, { border: `border-${c}-500` }])),
      neutral: { border: 'border-neutral-200' },
    } as Record<SemanticColor, { border: string }>,
    orientation: {
      horizontal: {
        root: 'w-full flex-row',
        border: 'w-full',
        container: 'mx-3 whitespace-nowrap',
      },
      vertical: {
        root: 'h-full flex-col',
        border: 'h-full',
        container: 'my-2',
      },
    },
    size: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
    type: {
      solid: { border: 'border-solid' },
      dashed: { border: 'border-dashed' },
      dotted: { border: 'border-dotted' },
    },
  },
  compoundVariants: [
    // Shift up: new `sm` carries the old `md` weight, etc. Drops the old 1px
    // hairline (`xs`) — it was barely visible at typical Lynx pixel ratios.
    { orientation: 'horizontal' as const, size: 'sm' as const, class: { border: 'border-t-[2px]' } },
    { orientation: 'horizontal' as const, size: 'md' as const, class: { border: 'border-t-[3px]' } },
    { orientation: 'horizontal' as const, size: 'lg' as const, class: { border: 'border-t-[4px]' } },
    { orientation: 'horizontal' as const, size: 'xl' as const, class: { border: 'border-t-[5px]' } },
    { orientation: 'vertical' as const, size: 'sm' as const, class: { border: 'border-s-[2px]' } },
    { orientation: 'vertical' as const, size: 'md' as const, class: { border: 'border-s-[3px]' } },
    { orientation: 'vertical' as const, size: 'lg' as const, class: { border: 'border-s-[4px]' } },
    { orientation: 'vertical' as const, size: 'xl' as const, class: { border: 'border-s-[5px]' } },
  ],
  defaultVariants: {
    color: 'neutral' as const,
    size: 'sm' as const,
    type: 'solid' as const,
    orientation: 'horizontal' as const,
  },
}
