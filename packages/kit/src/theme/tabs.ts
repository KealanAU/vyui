/**
 * Tabs theme — adapted from nuxt/ui v3.0.2 `theme/tabs.ts` for Vue-Lynx.
 *
 * Notes on the port:
 *   - Light-mode only: all `dark:*` classes are stripped.
 *   - Focus / focus-visible classes are stripped (Lynx has no DOM focus ring).
 *   - `shadow-*` / `transition-shadow` removed.
 *   - Indicator CSS-vars renamed to the Vy-Lynx prefix
 *     (`--vy-tabs-indicator-size` / `--vy-tabs-indicator-position`) emitted by
 *     `TabsIndicator.vue` in `@vyui/core`.
 *   - Semantic colors mirror `button.ts` — every (color × variant) pair gets
 *     a concrete tailwind class via `compoundVariants`.
 */

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

// `pill`: solid indicator behind the active trigger, light text on top.
const pillTrigger = (_c: SemanticColor) =>
  `data-[state=active]:text-white data-[state=inactive]:text-neutral-500 active:data-[state=inactive]:text-neutral-900`

const pillIndicator = (c: SemanticColor) => `bg-${c}-500`

// `link`: underline indicator + colored active label.
const linkTrigger = (c: SemanticColor) =>
  `data-[state=active]:text-${c}-500 data-[state=inactive]:text-neutral-500 active:data-[state=inactive]:text-neutral-900`

const linkIndicator = (c: SemanticColor) => `bg-${c}-500`

export default {
  slots: {
    // Lynx's tailwind preset has no `inline-flex` and `display:flex` defaults
    // to `flex-direction: column` (unlike the web). Every flex container here
    // therefore needs an explicit `flex-row` / `flex-col`, or children stack
    // the wrong axis. The `trigger` is row because its children (icon, label,
    // trailing) are inline regardless of the tabs' orientation.
    //
    // `w-full` on root ensures it spans its parent when the parent is itself a
    // flex container — Lynx defaults a `<view>` width to its content otherwise.
    root: 'flex flex-col w-full gap-2',
    list: 'relative flex flex-row p-1 group',
    indicator: 'absolute transition-[translate,width] duration-200',
    trigger:
      'group relative flex flex-row items-center shrink-0 min-w-0 font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    content: 'w-full',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    label: 'truncate',
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
    variant: {
      pill: {
        list: 'bg-neutral-100 rounded-lg',
        trigger: 'flex-1 w-full',
        indicator: 'rounded-md',
      },
      link: {
        list: 'border-neutral-200',
        indicator: 'rounded-full',
      },
    },
    /**
     * Layout inside each trigger.
     * - `inline` (default): icon and label side-by-side. Works when each
     *   trigger has room (≥80 px content). Label gets `truncate`.
     * - `stacked`: icon above label. Use when many triggers crowd a narrow
     *   list (e.g. 6 pills on a 360-wide phone); the label then has the full
     *   trigger width instead of sharing it with the icon.
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
        // concrete pixel values — the old Tailwind `w-(--vy-tabs-indicator-size)`
        // / `translate-x-(--vy-tabs-indicator-position)` classes can't paint
        // on Lynx native (canonical write-up:
        // `core/src/components/Slider/SliderThumbImpl.vue` ~L45).
        indicator: 'left-0',
        trigger: 'justify-center',
      },
      vertical: {
        // Vertical tabs: list+content side-by-side, list stacks triggers
        // vertically. Both flip from the row defaults set in `slots`.
        root: 'flex-row',
        list: 'flex-col',
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
    // orientation × variant geometry
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
    // color × variant — concrete tailwind classes per pair
    ...COLORS.flatMap(color => [
      {
        color,
        variant: 'pill' as const,
        class: { indicator: pillIndicator(color), trigger: pillTrigger(color) },
      },
      {
        color,
        variant: 'link' as const,
        class: { indicator: linkIndicator(color), trigger: linkTrigger(color) },
      },
    ]),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'pill' as const,
    size: 'md' as const,
    direction: 'inline' as const,
  },
}
