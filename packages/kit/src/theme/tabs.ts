/**
 * Tabs theme — adapted from nuxt/ui v3.0.2 `theme/tabs.ts` for Vue-Lynx: dark
 * rides the semantic tokens (`dark:*` stripped), focus / `shadow-*` classes are
 * dropped, and the indicator CSS-vars carry the Vy prefix emitted by
 * `TabsIndicator.vue`. Semantic colors mirror `button.ts` — every
 * (color × variant) pair gets a concrete class via `compoundVariants`.
 */
import type { Color } from './colors'
import { type IconFg, iconFgFromToken } from './iconColor'

// `enableCSSInheritance: false` — active/inactive color lands on the `label` <text>.

// `pill`: solid indicator behind the active trigger. Press feedback is
// `active:opacity-*` on the trigger itself, which paints on the main thread the
// moment the finger lands, unlike the original's `group-active:` on the label.
const pillLabel = (_c: string) =>
  `group-ui-active:text-white group-ui-inactive:text-muted`

const pillIndicator = (c: string) => `bg-${c}-500`

// `link`: underline indicator + colored active label.
const linkLabel = (c: string) =>
  `group-ui-active:text-${c}-500 group-ui-inactive:text-muted`

const linkIndicator = (c: string) => `bg-${c}-500`

// Baked icon fill (see ./iconColor.ts). Tabs.vue bakes it per state, derived
// from the same label builder strings, so class and baked color can't drift.
export function iconFg(color: string, variant: 'pill' | 'link', active: boolean, isDark = false): IconFg {
  const label = (variant === 'link' ? linkLabel : pillLabel)(color)
  const token = label.match(new RegExp(`group-ui-${active ? 'active' : 'inactive'}:text-(\\S+)`))?.[1]
  return iconFgFromToken(token, isDark)
}

export default (colors: Color[]) => ({
  slots: {
    // Lynx's tailwind preset has no `inline-flex`, and `display:flex` defaults
    // to `flex-direction: column`, so every flex container needs an explicit
    // `flex-row` / `flex-col`. `w-full` on root makes it span a flex parent —
    // Lynx otherwise defaults a `<view>` to its content width.
    root: 'flex flex-col w-full min-w-0 max-w-full gap-2',
    list: 'relative flex flex-row min-w-0 max-w-full overflow-hidden p-1 group',
    indicator: 'absolute transition-[translate,width] duration-200',
    trigger:
      'group relative flex flex-row items-center shrink-0 min-w-0 font-medium rounded-md active:opacity-60 disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    content: 'w-full min-w-0',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    label: 'truncate',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: {
      pill: {
        list: 'bg-elevated rounded-lg',
        trigger: 'flex-1 w-full',
        indicator: 'rounded-md',
      },
      link: {
        list: 'border-default',
        indicator: 'rounded-full',
      },
    },
    /**
     * Layout inside each trigger. `inline` (default) puts icon and label
     * side-by-side (needs ≥80px per trigger); `stacked` puts the icon above the
     * label, for many triggers crowding a narrow list.
     */
    direction: {
      inline: {},
      stacked: {
        trigger: 'flex-col',
      },
    },
    orientation: {
      horizontal: {
        list: 'w-full',
        // Size + translate live in `TabsIndicator.vue`'s inline `:style` as
        // concrete pixel values — `w-(--vy-tabs-indicator-size)` and friends
        // can't paint on Lynx native (see `Slider/SliderThumbImpl.vue`).
        indicator: 'left-0',
        trigger: 'justify-center',
      },
      vertical: {
        // Vertical tabs: list+content side-by-side, triggers stacked.
        // `flex-none` cancels the `pill` variant's `flex-1` (an equal-WIDTH
        // device that along a column would stretch each trigger's HEIGHT);
        // `justify-start` makes the rail read as a sidebar list.
        root: 'flex-row min-h-0',
        list: 'flex-col shrink-0',
        trigger: 'flex-none justify-start',
        content: 'w-0 flex-1 min-w-0 min-h-0',
        indicator: 'top-0',
      },
    },
    size: {
      sm: {
        trigger: 'px-3 py-1.5 text-sm gap-1.5',
        leadingIcon: 'size-5',
      },
      md: {
        trigger: 'px-3 py-2 text-sm gap-2',
        leadingIcon: 'size-5',
      },
      lg: {
        trigger: 'px-3 py-2 text-base gap-2',
        leadingIcon: 'size-6',
      },
      xl: {
        trigger: 'px-3.5 py-2.5 text-lg gap-2.5',
        leadingIcon: 'size-7',
      },
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal' as const,
      variant: 'pill' as const,
      class: { indicator: 'inset-y-1' },
    },
    {
      orientation: 'horizontal' as const,
      variant: 'link' as const,
      class: { list: 'border-b -mb-px', indicator: '-bottom-px h-px' },
    },
    {
      orientation: 'vertical' as const,
      variant: 'pill' as const,
      class: { indicator: 'inset-x-1', list: 'items-center' },
    },
    {
      orientation: 'vertical' as const,
      variant: 'link' as const,
      class: { list: 'border-s -ms-px', indicator: '-start-px w-px' },
    },
    ...colors.flatMap(color => [
      {
        color,
        variant: 'pill' as const,
        class: { indicator: pillIndicator(color), label: pillLabel(color), leadingIcon: pillLabel(color) },
      },
      {
        color,
        variant: 'link' as const,
        class: { indicator: linkIndicator(color), label: linkLabel(color), leadingIcon: linkLabel(color) },
      },
    ]),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'pill' as const,
    size: 'md' as const,
    direction: 'inline' as const,
  },
})
