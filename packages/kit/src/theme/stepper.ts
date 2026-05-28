// Ported from nuxt/ui v3.0.2 `src/theme/stepper.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config — see
// `apps/examples/ui-demo/src/index.css`.

const COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

type SemanticColor = typeof COLORS[number]

export default {
  slots: {
    // `root` + `header` directions are flipped per orientation variant.
    root: 'flex gap-4',
    header: 'flex',
    item: 'group text-center relative w-full',
    container: 'relative',
    trigger: 'rounded-full font-medium text-center align-middle flex flex-row items-center justify-center font-semibold group-data-[state=completed]:text-white group-data-[state=active]:text-white text-neutral-500 bg-neutral-100',
    indicator: 'flex flex-row items-center justify-center size-full',
    icon: 'shrink-0',
    separator: 'absolute rounded-full group-data-[disabled]:opacity-75 bg-neutral-200',
    wrapper: '',
    title: 'font-medium text-neutral-900',
    description: 'text-neutral-500 text-wrap',
    content: 'size-full',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-col',
        header: 'flex-row',
        container: 'flex flex-row justify-center',
        separator: 'top-[calc(50%-2px)] h-0.5',
        wrapper: 'mt-1',
      },
      vertical: {
        header: 'flex-col gap-4',
        item: 'flex flex-row text-start',
        separator: 'start-[calc(50%-1px)] -bottom-[10px] w-0.5',
      },
    },
    size: {
      sm: {
        trigger: 'size-10 text-base',
        icon: 'size-5',
        title: 'text-sm',
        description: 'text-sm',
        wrapper: 'mt-2.5',
      },
      md: {
        trigger: 'size-12 text-lg',
        icon: 'size-6',
        title: 'text-base',
        description: 'text-base',
        wrapper: 'mt-3',
      },
      lg: {
        trigger: 'size-14 text-xl',
        icon: 'size-7',
        title: 'text-lg',
        description: 'text-lg',
        wrapper: 'mt-3.5',
      },
      xl: {
        trigger: 'size-16 text-2xl',
        icon: 'size-8',
        title: 'text-xl',
        description: 'text-xl',
        wrapper: 'mt-4',
      },
    },
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
  },
  compoundVariants: [
    // color -> active/completed trigger + completed separator fills
    ...COLORS.map(color => ({
      color,
      class: {
        trigger: `group-data-[state=completed]:bg-${color}-500 group-data-[state=active]:bg-${color}-500`,
        separator: `group-data-[state=completed]:bg-${color}-500`,
      },
    })),
    // horizontal separator x-positioning per size
    { orientation: 'horizontal' as const, size: 'sm' as const, class: { separator: 'start-[calc(50%+28px)] end-[calc(-50%+28px)]' } },
    { orientation: 'horizontal' as const, size: 'md' as const, class: { separator: 'start-[calc(50%+32px)] end-[calc(-50%+32px)]' } },
    { orientation: 'horizontal' as const, size: 'lg' as const, class: { separator: 'start-[calc(50%+36px)] end-[calc(-50%+36px)]' } },
    { orientation: 'horizontal' as const, size: 'xl' as const, class: { separator: 'start-[calc(50%+40px)] end-[calc(-50%+40px)]' } },
    // vertical separator y-positioning + item gap per size
    { orientation: 'vertical' as const, size: 'sm' as const, class: { separator: 'top-[46px]', item: 'gap-2.5' } },
    { orientation: 'vertical' as const, size: 'md' as const, class: { separator: 'top-[54px]', item: 'gap-3' } },
    { orientation: 'vertical' as const, size: 'lg' as const, class: { separator: 'top-[62px]', item: 'gap-3.5' } },
    { orientation: 'vertical' as const, size: 'xl' as const, class: { separator: 'top-[70px]', item: 'gap-4' } },
  ],
  defaultVariants: {
    size: 'md' as const,
    color: 'primary' as const,
    orientation: 'horizontal' as const,
  },
}
