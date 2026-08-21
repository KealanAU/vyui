// Ported from nuxt/ui v3.0.2 `src/theme/input-menu.ts` and adapted for Vue-Lynx:
// dark rides the semantic tokens, `focus*` / `shadow*` / `dark:*` are dropped,
// and the result is flattened into a single tv config. Tags-input slots are
// omitted — core lacks a TagsInput primitive, so `multiple` renders without
// chips. Leading / trailing wrappers are inline flex siblings of the search
// input, not `absolute` overlays (as in `./input.ts`).

import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'relative flex flex-row items-center w-full',
    // `base` is the trigger <view> — surface only. The value <text> and search
    // <input> carry their own colors (set in Combobox.vue): CSS inheritance is
    // OFF in the Lynx build, so a trigger `text-*` never reaches them.
    base: 'relative w-full rounded-md flex flex-row items-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    input: 'flex-1 min-w-0 bg-transparent outline-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75',
    arrow: 'fill-default',
    content: 'max-h-[100vh] w-full bg-default rounded-md border border-default overflow-hidden pointer-events-auto',
    handle: 'self-center w-9 h-1 rounded-full bg-accented mt-1.5 mb-1',
    sheetHeader: 'px-4 pt-2 pb-1',
    sheetTitle: 'text-muted text-xs font-semibold uppercase',
    search: 'flex flex-row items-center gap-2 px-3 py-1.5 border-b border-default',
    searchIcon: 'size-5 shrink-0',
    viewport: 'flex-1 min-h-0 px-2 py-1 overflow-y-auto divide-y divide-muted scroll-py-1',
    group: 'p-1',
    empty: 'py-2 text-center text-sm text-muted',
    label: 'font-semibold text-highlighted',
    separator: '-mx-1 my-1 h-px bg-accented',
    // `item` is the row <view> — surface/layout only. The label color lives on
    // `itemLabel`, which a `text-*` on the row would never reach.
    item: 'group relative w-full flex flex-row items-center select-none rounded-md ui-disabled:cursor-not-allowed ui-disabled:opacity-75 transition-colors px-3 py-2.5',
    itemLeadingIcon: 'shrink-0 transition-colors',
    itemLeadingAvatar: 'shrink-0',
    itemTrailing: 'ms-auto flex flex-row gap-1.5 items-center',
    itemTrailingIcon: 'shrink-0',
    itemLabel: 'truncate text-default group-ui-checked:text-highlighted',
    leading: 'flex flex-row items-center shrink-0',
    leadingIcon: 'shrink-0 text-dimmed',
    leadingAvatar: 'shrink-0',
    trailing: 'flex flex-row items-center shrink-0 ms-auto',
    trailingIcon: 'shrink-0 text-dimmed',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: {
      outline: { base: 'bg-default border border-default' },
      soft: { base: 'bg-muted active:bg-elevated disabled:bg-muted' },
      subtle: { base: 'bg-elevated border border-default' },
      ghost: { base: 'bg-transparent active:bg-elevated disabled:bg-transparent' },
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
    // Resting border is neutral; the colored border is opt-in via `highlight`
    // (no focus state on Lynx).
    ...colors.map(color => ({ color, highlight: true, class: { base: `border border-${color}-500` } })),
    { loading: true, leading: true, class: { leadingIcon: 'animate-spin' } },
    { loading: true, leading: false, trailing: true, class: { trailingIcon: 'animate-spin' } },
    // Icons default to neutral (dimmed), decoupled from `color`; override via
    // the `leading` / `trailing` slots.
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'outline' as const,
    size: 'md' as const,
  },
})
