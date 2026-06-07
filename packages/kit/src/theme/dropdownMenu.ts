/**
 * DropdownMenu theme — adapted from nuxt/ui v3.0.2 `theme/dropdown-menu.ts`
 * for Vue-Lynx. Light-mode only; `dark:*`, `focus:*`, `focus-visible:*`, and
 * `transition-shadow` classes are dropped. Hover/active states keep
 * `data-[state=...]`, `ui-highlighted`, `ui-disabled`.
 * `shadow-lg shadow-black/10` matches `IslandContainer` so floating surfaces
 * share one elevation language.
 *
 * Semantic colors resolve to tailwind palettes via CSS variables, see
 * `packages/kit/src/theme/colors.ts` and the consuming app's CSS layer.
 */
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    content: 'min-w-32 bg-white rounded-lg border border-neutral-200 shadow-lg shadow-black/10 divide-y divide-neutral-200 overflow-y-auto ui-open:animate-[scale-in_100ms_ease-out] ui-closed:animate-[scale-out_100ms_ease-in]',
    group: 'p-1',
    label: 'w-full flex flex-row items-center font-semibold text-neutral-900',
    separator: '-mx-1 my-1 h-px bg-neutral-200',
    item: 'group relative w-full flex flex-row items-start rounded-md ui-disabled:opacity-50 ui-disabled:cursor-not-allowed transition-colors',
    itemLeadingIcon: 'shrink-0',
    itemLeadingAvatar: 'shrink-0',
    itemLeadingAvatarSize: '',
    itemTrailing: 'ms-auto flex flex-row gap-1.5 items-center',
    itemTrailingIcon: 'shrink-0',
    itemWrapper: 'flex-1 flex flex-col text-start min-w-0',
    itemLabel: 'truncate',
    itemDescription: 'truncate text-xs text-neutral-500',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    // `enableCSSInheritance: false`: foreground text color set on the `item`
    // <view> (CoreDropdownMenuItem) does NOT reach the nested `itemLabel`
    // <text>. The label color rides on `itemLabel` (the `item` carries the
    // `group` class, so its `data-[…]` state drives `group-data-[…]:` here);
    // only the `bg-*` surface stays on `item`.
    active: {
      true: {
        item: 'bg-neutral-100',
        itemLabel: 'text-neutral-900',
        itemLeadingIcon: 'text-neutral-700',
      },
      false: {
        item: 'ui-highlighted:bg-neutral-100 ui-open:bg-neutral-100',
        itemLabel: 'text-neutral-700 group-ui-highlighted:text-neutral-900 group-ui-open:text-neutral-900',
        itemLeadingIcon: 'text-neutral-500 group-ui-highlighted:text-neutral-700 group-ui-open:text-neutral-700',
      },
    },
    loading: {
      true: {
        itemLeadingIcon: 'animate-spin',
      },
    },
    size: {
      sm: {
        label: 'p-1.5 text-sm gap-1.5',
        item: 'p-1.5 text-sm gap-1.5',
        itemLeadingIcon: 'size-5',
        itemTrailingIcon: 'size-5',
      },
      md: {
        label: 'p-2 text-sm gap-2',
        item: 'p-2 text-sm gap-2',
        itemLeadingIcon: 'size-5',
        itemTrailingIcon: 'size-5',
      },
      lg: {
        label: 'p-2 text-base gap-2',
        item: 'p-2 text-base gap-2',
        itemLeadingIcon: 'size-6',
        itemTrailingIcon: 'size-6',
      },
      xl: {
        label: 'p-2.5 text-lg gap-2.5',
        item: 'p-2.5 text-lg gap-2.5',
        itemLeadingIcon: 'size-7',
        itemTrailingIcon: 'size-7',
      },
    },
  },
  compoundVariants: [
    // Foreground (`text-*`) rides on `itemLabel`/`itemLeadingIcon`, surface
    // (`bg-*`) on `item` — see the `active` variant note (`enableCSSInheritance`
    // is off). State selectors become `group-data-[…]:` on the label since the
    // `item` <view> owns the `group` + `data-[…]` state.
    ...colors.map(color => ({
      color,
      active: false as const,
      class: {
        item: `ui-highlighted:bg-${color}-50 ui-open:bg-${color}-50`,
        itemLabel: `text-${color}-500 group-ui-highlighted:text-${color}-600`,
        itemLeadingIcon: `text-${color}-500 group-ui-highlighted:text-${color}-600 group-ui-open:text-${color}-600`,
      },
    })),
    ...colors.map(color => ({
      color,
      active: true as const,
      class: {
        item: `bg-${color}-50`,
        itemLabel: `text-${color}-600`,
        itemLeadingIcon: `text-${color}-600`,
      },
    })),
  ],
  defaultVariants: {
    size: 'md' as const,
  },
})
