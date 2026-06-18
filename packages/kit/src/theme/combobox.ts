// Ported from nuxt/ui v3.0.2 `src/theme/input-menu.ts` (which extends
// `input.ts`) and adapted for Vue-Lynx: light-mode only, semantic Tailwind
// tokens replace `--ui-*` CSS vars, `focus*` / `shadow*` / `dark:*` /
// `transition-shadow` classes are dropped, and the result is flattened into a
// single tv config. Tags-input slots from upstream are omitted — core lacks
// a TagsInput primitive, so `multiple` mode renders without tag chips.
//
// Lynx adaptation mirrors `./input.ts`: leading / trailing wrappers are
// inline flex siblings of the search input, not `absolute` overlays.

import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'relative flex flex-row items-center w-full',
    // `base` is the trigger <view> — surface only. The trigger value <text> and
    // search <input> carry their own text colors (set in Combobox.vue): CSS
    // inheritance is OFF in the Lynx build (`enableCSSInheritance: false`), so a
    // `text-*` on the trigger <view> never reaches those children.
    base: 'relative w-full rounded-md flex flex-row items-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    input: 'flex-1 min-w-0 bg-transparent outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-75',
    arrow: 'fill-neutral-200',
    content: 'max-h-[100dvh] w-full bg-white rounded-md border border-neutral-200 overflow-hidden pointer-events-auto',
    handle: 'self-center w-9 h-1 rounded-full bg-neutral-300 mt-1.5 mb-1',
    sheetHeader: 'px-4 pt-2 pb-1',
    sheetTitle: 'text-neutral-500 text-xs font-semibold uppercase',
    search: 'flex flex-row items-center gap-2 px-3 py-1.5 border-b border-neutral-200',
    searchIcon: 'size-5 shrink-0',
    viewport: 'flex-1 min-h-0 px-2 py-1 overflow-y-auto divide-y divide-neutral-100 scroll-py-1',
    group: 'p-1',
    empty: 'py-2 text-center text-sm text-neutral-500',
    label: 'font-semibold text-neutral-900',
    separator: '-mx-1 my-1 h-px bg-neutral-200',
    // `item` is the row <view> — surface/layout only. Item label color lives on
    // `itemLabel` (the row's <text>): CSS inheritance is OFF in the Lynx build
    // (`enableCSSInheritance: false`), so a `text-*` on the row <view> never
    // reaches the label <text>.
    item: 'group relative w-full flex flex-row items-center select-none rounded-md ui-disabled:cursor-not-allowed ui-disabled:opacity-75 transition-colors px-3 py-2.5',
    itemLeadingIcon: 'shrink-0 transition-colors',
    itemLeadingAvatar: 'shrink-0',
    itemTrailing: 'ms-auto flex flex-row gap-1.5 items-center',
    itemTrailingIcon: 'shrink-0',
    itemLabel: 'truncate text-neutral-700 group-ui-checked:text-neutral-900',
    leading: 'flex flex-row items-center shrink-0',
    leadingIcon: 'shrink-0 text-neutral-400',
    leadingAvatar: 'shrink-0',
    trailing: 'flex flex-row items-center shrink-0 ms-auto',
    trailingIcon: 'shrink-0 text-neutral-400',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: {
      outline: { base: 'bg-white border border-neutral-200' },
      soft: { base: 'bg-neutral-100/50 active:bg-neutral-100 disabled:bg-neutral-100/50' },
      subtle: { base: 'bg-neutral-100 border border-neutral-200' },
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
    // Resting border is neutral regardless of `color` — Lynx has no focus
    // state, so the colored chrome is reserved for the opt-in `highlight` prop
    // below, not the default look.
    ...colors.map(color => ({ color, highlight: true, class: { base: `border border-${color}-500` } })),
    { loading: true, leading: true, class: { leadingIcon: 'animate-spin' } },
    { loading: true, leading: false, trailing: true, class: { trailingIcon: 'animate-spin' } },
    // Leading/trailing icons default to neutral (dimmed), decoupled from
    // `color` like the border — see `slots.leadingIcon` / `trailingIcon`.
    // Override via the `leading` / `trailing` slots (the Lynx fill is baked
    // from the component's neutral `iconColor`).
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'outline' as const,
    size: 'md' as const,
  },
})
