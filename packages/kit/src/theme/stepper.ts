// Ported from nuxt/ui v3.0.2 `src/theme/stepper.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config — see
// `apps/examples/kit-demo/src/index.css`.
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    // `root` + `header` directions are flipped per orientation variant.
    root: 'flex min-w-0 max-w-full gap-4',
    header: 'flex min-w-0 max-w-full',
    item: 'group text-center relative w-full min-w-0',
    container: 'relative min-w-0',
    // `enableCSSInheritance: false`: the foreground (`text-*`) must sit on the
    // indicator content (`icon` slot / the step-number <text>), not the
    // `trigger` <view> — color there never reaches the nested icon/number. The
    // `item` carries the `group`, so state stays `group-data-[state=…]:`. The
    // `bg-*` fill stays on `trigger`.
    trigger: 'rounded-full font-medium text-center align-middle flex flex-row items-center justify-center font-semibold bg-elevated',
    indicator: 'flex flex-row items-center justify-center size-full',
    icon: 'shrink-0 group-ui-completed:text-white group-ui-active:text-white text-muted',
    separator: 'absolute rounded-full group-ui-disabled:opacity-75 bg-accented',
    wrapper: 'min-w-0',
    title: 'font-medium text-highlighted',
    description: 'text-muted text-wrap',
    content: 'size-full min-w-0 min-h-0',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-col',
        header: 'flex-row overflow-hidden',
        container: 'flex flex-row justify-center',
        separator: 'top-[calc(50%-2px)] h-0.5',
        wrapper: 'mt-1',
      },
      vertical: {
        header: 'flex-col min-h-0 gap-4',
        item: 'flex flex-row min-h-0 text-start',
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
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
  },
  compoundVariants: [
    ...colors.map(color => ({
      color,
      class: {
        trigger: `group-ui-completed:bg-${color}-500 group-ui-active:bg-${color}-500`,
        separator: `group-ui-completed:bg-${color}-500`,
      },
    })),
    { orientation: 'horizontal' as const, size: 'sm' as const, class: { separator: 'start-[calc(50%+28px)] end-[calc(-50%+28px)]' } },
    { orientation: 'horizontal' as const, size: 'md' as const, class: { separator: 'start-[calc(50%+32px)] end-[calc(-50%+32px)]' } },
    { orientation: 'horizontal' as const, size: 'lg' as const, class: { separator: 'start-[calc(50%+36px)] end-[calc(-50%+36px)]' } },
    { orientation: 'horizontal' as const, size: 'xl' as const, class: { separator: 'start-[calc(50%+40px)] end-[calc(-50%+40px)]' } },
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
})
