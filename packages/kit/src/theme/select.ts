// Ported from nuxt/ui v3.0.2 `src/theme/select.ts` (which extends `input.ts`)
// and adapted for Vue-Lynx: light-mode only, semantic Tailwind tokens replace
// `--ui-*` CSS vars, `focus*` / `shadow*` / `dark:*` / `transition-shadow`
// classes are dropped, and the result is flattened into a single tv config
// (no `defu` merge with input theme since `Select` is its own component here).
//
// Lynx adaptation mirrors `./input.ts`: leading / trailing wrappers are
// inline flex siblings of the value text, not `absolute` overlays — Lynx's
// layout engine doesn't reliably overlay absolutely-positioned children on
// top of a sibling text run.
//
// Color palettes resolve via the consuming app's CSS variables — see
// `apps/examples/kit-demo/src/index.css` for the default semantic mapping.

import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'relative flex flex-row items-center',
    // `base` is the trigger <view> — surface only. The selected-value text
    // color lives on the `value` <text> slot and the placeholder color on the
    // `placeholder` <text> slot: CSS inheritance is OFF in the Lynx build
    // (`enableCSSInheritance: false`), so a `text-*` on the trigger <view>
    // never reaches those <text> children.
    base: 'w-full rounded-md flex flex-row items-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    value: 'flex-1 min-w-0 truncate text-start text-neutral-900',
    placeholder: 'flex-1 min-w-0 truncate text-start text-neutral-400',
    arrow: 'fill-neutral-200',
    content: 'max-h-60 w-full bg-white rounded-md border border-neutral-200 overflow-hidden pointer-events-auto',
    handle: 'self-center w-9 h-1 rounded-full bg-neutral-300 mt-2 mb-1',
    viewport: 'divide-y divide-neutral-100 scroll-py-1',
    group: 'p-1',
    empty: 'py-2 text-center text-sm text-neutral-500',
    label: 'font-semibold text-neutral-900',
    separator: '-mx-1 my-1 h-px bg-neutral-200',
    // `item` is the row <view> — surface/layout only. Item label color lives on
    // `itemLabel` (the SelectItemText <text>): CSS inheritance is OFF in the
    // Lynx build (`enableCSSInheritance: false`), so a `text-*` on the row
    // <view> never reaches the label <text>.
    item: 'group relative w-full flex flex-row items-center select-none rounded-md ui-disabled:cursor-not-allowed ui-disabled:opacity-75 transition-colors',
    itemLeadingIcon: 'shrink-0 transition-colors',
    itemLeadingAvatar: 'shrink-0',
    itemTrailing: 'ms-auto flex flex-row gap-1.5 items-center',
    itemTrailingIcon: 'shrink-0',
    itemLabel: 'truncate text-neutral-700 group-ui-checked:text-neutral-900',
    leading: 'flex flex-row items-center shrink-0',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    trailing: 'flex flex-row items-center shrink-0 ms-auto',
    trailingIcon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
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
  },
  compoundVariants: [
    // outline / subtle border colors per semantic color.
    ...colors.flatMap(color => [
      { color, variant: 'outline' as const, class: { base: `border-${color}-500` } },
      { color, variant: 'subtle' as const, class: { base: `border-${color}-500` } },
    ]),
    // `highlight` paints a static border matching the color.
    ...colors.map(color => ({ color, highlight: true, class: { base: `border border-${color}-500` } })),
    // Loading spinner animation on icon slot.
    { loading: true, leading: true, class: { leadingIcon: 'animate-spin' } },
    { loading: true, leading: false, trailing: true, class: { trailingIcon: 'animate-spin' } },
    // Theme-driven leading/trailing icon color per semantic select color
    // (Lynx SVG can't inherit currentColor — the Select component also bakes
    // the resolved hex into `<VyIcon :color>`).
    ...colors.map(color => ({
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
})
