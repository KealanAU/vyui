/**
 * Tabs theme — adapted from nuxt/ui v3.0.2 `theme/tabs.ts` for Vue-Lynx.
 *
 * Notes on the port:
 *   - Dark rides the semantic tokens: all `dark:*` classes are stripped.
 *   - Focus / focus-visible classes are stripped (Lynx has no DOM focus ring).
 *   - `shadow-*` / `transition-shadow` removed.
 *   - Indicator CSS-vars renamed to the Vy-Lynx prefix
 *     (`--vy-tabs-indicator-size` / `--vy-tabs-indicator-position`) emitted by
 *     `TabsIndicator.vue` in `@vyui/core`.
 *   - Semantic colors mirror `button.ts` — every (color × variant) pair gets
 *     a concrete tailwind class via `compoundVariants`.
 */
import type { Color } from './colors'
import { type IconFg, iconFgFromToken } from './iconColor'

// `enableCSSInheritance: false`: the active/inactive text color must sit on the
// `label` <text>, not the `trigger` <view> (color set there never reaches the
// nested label). The `trigger` carries the `group` class + `data-[state=…]`, so
// the label uses `group-data-[state=…]:`. Indicator keeps its `bg-*` surface.

// `pill`: solid indicator behind the active trigger, light text on top. The
// `active:` press-feedback that the original carried on the trigger is dropped
// here: it relied on the trigger's own `active:` pseudo, which doesn't translate
// to the child label as a reliable `group-active:` on Lynx. State colors use
// `group-data-[state=…]:` (the trigger owns the `group` + `data-state`).
const pillLabel = (_c: string) =>
  `group-ui-active:text-white group-ui-inactive:text-muted`

const pillIndicator = (c: string) => `bg-${c}-500`

// `link`: underline indicator + colored active label.
const linkLabel = (c: string) =>
  `group-ui-active:text-${c}-500 group-ui-inactive:text-muted`

const linkIndicator = (c: string) => `bg-${c}-500`

// Same Lynx constraint as `button.ts`'s `iconFg`: the `<svg>` rasterizes its
// XML, so the state-dependent `group-ui-*:text-*` classes spread onto
// `leadingIcon` never reach the glyph — Tabs.vue bakes the fill per state via
// the Icon `color` prop (resolved with `resolveColorHex`). Derive it from the
// same label builder strings so class and baked color can't drift.
export function iconFg(color: string, variant: 'pill' | 'link', active: boolean, isDark = false): IconFg {
  const label = (variant === 'link' ? linkLabel : pillLabel)(color)
  const token = label.match(new RegExp(`group-ui-${active ? 'active' : 'inactive'}:text-(\\S+)`))?.[1]
  return iconFgFromToken(token, isDark)
}

export default (colors: Color[]) => ({
  slots: {
    // Lynx's tailwind preset has no `inline-flex` and `display:flex` defaults
    // to `flex-direction: column` (unlike the web). Every flex container here
    // therefore needs an explicit `flex-row` / `flex-col`, or children stack
    // the wrong axis. The `trigger` is row because its children (icon, label,
    // trailing) are inline regardless of the tabs' orientation.
    //
    // `w-full` on root ensures it spans its parent when the parent is itself a
    // flex container — Lynx defaults a `<view>` width to its content otherwise.
    root: 'flex flex-col w-full min-w-0 max-w-full gap-2',
    list: 'relative flex flex-row min-w-0 max-w-full overflow-hidden p-1 group',
    indicator: 'absolute transition-[translate,width] duration-200',
    trigger:
      'group relative flex flex-row items-center shrink-0 min-w-0 font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
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
        // `flex-none` cancels the `pill` variant's `flex-1` (an equal-WIDTH
        // device for horizontal rows — along a column it would stretch each
        // trigger's HEIGHT to fill the rail). `justify-start` left-aligns the
        // icon+label so the rail reads as a sidebar list, not centered chips.
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
