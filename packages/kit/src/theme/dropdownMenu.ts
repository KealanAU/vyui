/**
 * DropdownMenu theme — adapted from nuxt/ui v3.0.2 `theme/dropdown-menu.ts` for
 * Vue-Lynx. Dark rides the semantic tokens; `dark:*` / `focus*` are dropped and
 * hover/active states keep `data-[state=...]`, `ui-highlighted`, `ui-disabled`.
 * `shadow-lg shadow-black/10` matches `Island` so floating surfaces
 * share one elevation language.
 */
import type { Color } from './colors'

// Same Lynx constraint as `button.ts`'s `iconFg`: the `<svg>` rasterizes its
// XML, so the `text-*` classes on the icon slots never reach the glyph —
// `DropdownMenuItems.vue` bakes the resting fill via the Icon `color` prop. Keep
// in sync with the `active` variant + the per-color compoundVariants below.
export function iconFg(color?: string): { semantic: string, shade: number } {
  return color ? { semantic: color, shade: 500 } : { semantic: 'neutral', shade: 500 }
}

export default (colors: Color[]) => ({
  slots: {
    content: 'min-w-32 max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] bg-default rounded-lg border border-default shadow-lg shadow-black/10 divide-y divide-default overflow-y-auto',
    group: 'p-1',
    label: 'w-full flex flex-row items-center font-semibold text-highlighted',
    separator: '-mx-1 my-1 h-px bg-accented',
    item: 'group relative w-full flex flex-row items-start rounded-md ui-disabled:opacity-50 ui-disabled:cursor-not-allowed transition-colors',
    itemLeadingIcon: 'shrink-0',
    itemLeadingAvatar: 'shrink-0',
    itemLeadingAvatarSize: '',
    itemTrailing: 'ms-auto flex flex-row gap-1.5 items-center',
    itemWrapper: 'flex-1 flex flex-col text-start min-w-0',
    itemLabel: 'truncate',
    itemDescription: 'truncate text-xs text-muted',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    // `enableCSSInheritance: false`: a foreground color on the `item` <view>
    // does NOT reach the nested `itemLabel` <text>, so the label color rides on
    // `itemLabel` (the `item` carries `group`, driving `group-data-[…]:` here)
    // and only the `bg-*` surface stays on `item`.
    active: {
      true: {
        item: 'bg-elevated',
        itemLabel: 'text-highlighted',
        itemLeadingIcon: 'text-default',
      },
      false: {
        item: 'ui-highlighted:bg-elevated ui-open:bg-elevated',
        itemLabel: 'text-default group-ui-highlighted:text-highlighted group-ui-open:text-highlighted',
        itemLeadingIcon: 'text-muted group-ui-highlighted:text-default group-ui-open:text-default',
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
      },
      md: {
        label: 'p-2 text-sm gap-2',
        item: 'p-2 text-sm gap-2',
        itemLeadingIcon: 'size-5',
      },
      lg: {
        label: 'p-2 text-base gap-2',
        item: 'p-2 text-base gap-2',
        itemLeadingIcon: 'size-6',
      },
      xl: {
        label: 'p-2.5 text-lg gap-2.5',
        item: 'p-2.5 text-lg gap-2.5',
        itemLeadingIcon: 'size-7',
      },
    },
  },
  compoundVariants: [
    // Foreground rides on `itemLabel`/`itemLeadingIcon`, surface on `item` — see
    // the `active` variant note.
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
