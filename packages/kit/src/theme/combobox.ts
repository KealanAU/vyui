// Ported from nuxt/ui v3.0.2 `src/theme/input-menu.ts` (which extends
// `input.ts`) and adapted for Vue-Lynx: light-mode only, semantic Tailwind
// tokens replace `--ui-*` CSS vars, `focus*` / `shadow*` / `dark:*` /
// `transition-shadow` classes are dropped, and the result is flattened into a
// single tv config. Tags-input slots from upstream are omitted — core lacks
// a TagsInput primitive, so `multiple` mode renders without tag chips.
//
// Lynx adaptation mirrors `./input.ts`: leading / trailing wrappers are
// inline flex siblings of the search input, not `absolute` overlays.

import { COLORS } from './colors'

export default {
  slots: {
    root: 'relative flex flex-row items-center w-full',
    base: 'relative w-full rounded-md flex flex-row items-center text-neutral-900 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    input: 'flex-1 min-w-0 bg-transparent outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-75',
    arrow: 'fill-neutral-200',
    content: 'max-h-60 w-full bg-white rounded-md border border-neutral-200 overflow-hidden pointer-events-auto',
    viewport: 'divide-y divide-neutral-100 scroll-py-1',
    group: 'p-1',
    empty: 'py-2 text-center text-sm text-neutral-500',
    label: 'font-semibold text-neutral-900',
    separator: '-mx-1 my-1 h-px bg-neutral-200',
    item: 'group relative w-full flex flex-row items-center select-none rounded-md data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75 text-neutral-700 data-[state=checked]:text-neutral-900 transition-colors',
    itemLeadingIcon: 'shrink-0 transition-colors',
    itemLeadingAvatar: 'shrink-0',
    itemTrailing: 'ms-auto flex flex-row gap-1.5 items-center',
    itemTrailingIcon: 'shrink-0',
    itemLabel: 'truncate',
    leading: 'flex flex-row items-center shrink-0',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    trailing: 'flex flex-row items-center shrink-0 ms-auto',
    trailingIcon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<typeof COLORS[number], ''>,
    variant: {
      outline: { base: 'bg-white border' },
      soft: { base: 'bg-neutral-100/50 active:bg-neutral-100 disabled:bg-neutral-100/50' },
      subtle: { base: 'bg-neutral-100 border' },
      ghost: { base: 'bg-transparent active:bg-neutral-100 disabled:bg-transparent' },
      none: { base: 'bg-transparent' },
    },
    size: {
      sm: {
        base: 'px-2.5 py-1.5 text-sm gap-2',
        leadingIcon: 'size-5',
        trailingIcon: 'size-5',
        label: 'p-1.5 text-xs gap-1.5',
        item: 'p-1.5 text-sm gap-1.5',
        itemLeadingIcon: 'size-5',
        itemTrailingIcon: 'size-5',
      },
      md: {
        base: 'px-3 py-2 text-sm gap-2',
        leadingIcon: 'size-5',
        trailingIcon: 'size-5',
        label: 'p-2 text-xs gap-2',
        item: 'p-2 text-sm gap-2',
        itemLeadingIcon: 'size-5',
        itemTrailingIcon: 'size-5',
      },
      lg: {
        base: 'px-3 py-2 text-base gap-2.5',
        leadingIcon: 'size-6',
        trailingIcon: 'size-6',
        label: 'p-2 text-sm gap-2',
        item: 'p-2 text-base gap-2',
        itemLeadingIcon: 'size-6',
        itemTrailingIcon: 'size-6',
      },
      xl: {
        base: 'px-3.5 py-2.5 text-lg gap-3',
        leadingIcon: 'size-7',
        trailingIcon: 'size-7',
        label: 'p-2.5 text-base gap-2.5',
        item: 'p-2.5 text-lg gap-2.5',
        itemLeadingIcon: 'size-7',
        itemTrailingIcon: 'size-7',
      },
    },
    leading: { true: '' },
    trailing: { true: '' },
    loading: { true: '' },
    highlight: { true: '' },
    multiple: { true: { root: 'flex-wrap' } },
  },
  compoundVariants: [
    ...COLORS.flatMap(color => [
      { color, variant: 'outline' as const, class: { base: `border-${color}-500` } },
      { color, variant: 'subtle' as const, class: { base: `border-${color}-500` } },
    ]),
    ...COLORS.map(color => ({ color, highlight: true, class: { base: `border border-${color}-500` } })),
    { loading: true, leading: true, class: { leadingIcon: 'animate-spin' } },
    { loading: true, leading: false, trailing: true, class: { trailingIcon: 'animate-spin' } },
    // Theme-driven icon color per semantic combobox color (Lynx SVG can't
    // inherit currentColor — the Combobox component also bakes the resolved
    // hex into `<VyIcon :color>`).
    ...COLORS.map(color => ({
      color,
      class: {
        leadingIcon: `text-${color}-500`,
        trailingIcon: `text-${color}-500`,
      },
    })),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'outline' as const,
    size: 'md' as const,
  },
}
