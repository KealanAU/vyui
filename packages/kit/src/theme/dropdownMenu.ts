/**
 * DropdownMenu theme — adapted from nuxt/ui v3.0.2 `theme/dropdown-menu.ts`
 * for Vue-Lynx. Light-mode only; `dark:*`, `focus:*`, `focus-visible:*`, and
 * `transition-shadow` classes are dropped. Hover/active states keep
 * `data-[state=...]`, `data-[highlighted]`, `data-[disabled]`.
 * `shadow-lg shadow-black/10` matches `IslandContainer` so floating surfaces
 * share one elevation language.
 *
 * Semantic colors resolve to tailwind palettes via CSS variables, see
 * `packages/kit/src/theme/colors.ts` and the consuming app's CSS layer.
 */
import { COLORS } from './colors'

export default {
  slots: {
    content: 'min-w-32 bg-white rounded-lg border border-neutral-200 shadow-lg shadow-black/10 divide-y divide-neutral-200 overflow-y-auto data-[state=open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]',
    group: 'p-1',
    label: 'w-full flex flex-row items-center font-semibold text-neutral-900',
    separator: '-mx-1 my-1 h-px bg-neutral-200',
    item: 'group relative w-full flex flex-row items-start rounded-md data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed transition-colors',
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
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<typeof COLORS[number], ''>,
    active: {
      true: {
        item: 'text-neutral-900 bg-neutral-100',
        itemLeadingIcon: 'text-neutral-700',
      },
      false: {
        item: 'text-neutral-700 data-[highlighted]:text-neutral-900 data-[state=open]:text-neutral-900 data-[highlighted]:bg-neutral-100 data-[state=open]:bg-neutral-100',
        itemLeadingIcon: 'text-neutral-500 group-data-[highlighted]:text-neutral-700 group-data-[state=open]:text-neutral-700',
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
    ...COLORS.map(color => ({
      color,
      active: false as const,
      class: {
        item: `text-${color}-500 data-[highlighted]:text-${color}-600 data-[highlighted]:bg-${color}-50 data-[state=open]:bg-${color}-50`,
        itemLeadingIcon: `text-${color}-500 group-data-[highlighted]:text-${color}-600 group-data-[state=open]:text-${color}-600`,
      },
    })),
    ...COLORS.map(color => ({
      color,
      active: true as const,
      class: {
        item: `text-${color}-600 bg-${color}-50`,
        itemLeadingIcon: `text-${color}-600`,
      },
    })),
  ],
  defaultVariants: {
    size: 'md' as const,
  },
}
