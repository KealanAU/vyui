/**
 * ToggleGroup theme — modelled on a segmented-control / button-group adapted
 * from nuxt/ui v3.0.2 conventions (`theme/button.ts` variant matrix, plus
 * `theme/button-group.ts` orientation rounding). Light-only port for Vue-Lynx.
 *
 * Each item renders a `ToggleGroupItem` styled like a button; the
 * `ui-on` attribute is used to flip into the active appearance per
 * color × variant. Variants supported: `outline`, `soft`, `subtle` (matches
 * what nuxt/ui surfaces for non-solid toggles). Dark rides the semantic tokens.
 */
import type { Color } from './colors'
import { type IconFg, iconFgFromToken } from './iconColor'

// Each builder returns the *inactive* + *on-state* surface classes (`base`,
// applied to the item <view>) separately from the foreground color (`fg`:
// text-*, incl. the on-state shift). CSS inheritance is OFF in the Lynx build
// (`enableCSSInheritance: false`), so a `text-*` on the item <view> never
// reaches the `leadingIcon` / `label` children — `fg` is spread onto those
// slots directly. The item <view> carries `group` + `data-state`, so the
// on-state color shift uses `group-ui-on:text-*` on the children
// (the children don't get `data-state` themselves). Same convention as
// `dropdownMenu.ts` / `stepper.ts`.
const outline = (c: string) =>
  ({
    base: `border border-accented bg-default active:bg-${c}-50 active:bg-${c}-100`
      + ` ui-on:border-${c}-500 ui-on:bg-${c}-50`,
    fg: `text-default group-ui-on:text-${c}-600`,
  })

const soft = (c: string) =>
  ({
    base: `bg-elevated active:bg-${c}-50 active:bg-${c}-100`
      + ` ui-on:bg-${c}-100`,
    fg: `text-default group-ui-on:text-${c}-600`,
  })

const subtle = (c: string) =>
  ({
    base: `border border-default bg-default active:bg-${c}-50 active:bg-${c}-100`
      + ` ui-on:border-${c}-300 ui-on:bg-${c}-100`,
    fg: `text-default group-ui-on:text-${c}-600`,
  })

const VARIANT_BUILDERS = { outline, soft, subtle } as const

export type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

// Same Lynx constraint as `button.ts`'s `iconFg`: the `<svg>` rasterizes its
// XML, so neither the resting `text-*` nor the `group-ui-on:text-*` shift on
// `leadingIcon` ever reaches the glyph — ToggleGroup.vue bakes the fill per
// item from the `pressed` state core's Toggle forwards through its slot.
// Derive it from the same `fg` string the variant emits so class and baked
// color can't drift.
export function iconFg(color: string, variant: Variant, on: boolean, isDark = false): IconFg {
  const { fg } = VARIANT_BUILDERS[variant](color)
  // on → the `group-ui-on:text-*` accent; off → the resting `text-*` token.
  const suffix = on
    ? fg.match(/\bgroup-ui-on:text-(\S+)/)?.[1]
    : fg.match(/^text-(\S+)/)?.[1]
  return iconFgFromToken(suffix, isDark)
}

export default (colors: Color[]) => ({
  slots: {
    // `root` direction is set per orientation variant (flex-row/flex-col).
    root: 'flex min-w-0 max-w-full',
    // `group` so children can read the item's `data-state` via
    // `group-ui-on:*` (Lynx won't cascade `text-*`).
    item: 'group flex flex-row items-center justify-center min-w-0 max-w-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    leadingIcon: 'shrink-0',
    label: 'truncate',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: Object.fromEntries(VARIANTS.map(v => [v, ''])) as Record<Variant, ''>,
    size: {
      sm: { item: 'px-2.5 py-1.5 text-sm gap-1.5', leadingIcon: 'size-5' },
      md: { item: 'px-3 py-2 text-sm gap-2', leadingIcon: 'size-5' },
      lg: { item: 'px-3 py-2 text-base gap-2', leadingIcon: 'size-6' },
      xl: { item: 'px-3.5 py-2.5 text-lg gap-2.5', leadingIcon: 'size-7' },
    },
    orientation: {
      horizontal: {
        root: 'flex-row flex-wrap -space-x-px',
        item: 'first:rounded-s-md last:rounded-e-md',
      },
      vertical: {
        root: 'flex-col -space-y-px',
        item: 'first:rounded-t-md last:rounded-b-md w-full',
      },
    },
  },
  compoundVariants: [
    // Surface lands on `item`; foreground color (`fg`) on `leadingIcon` +
    // `label` since the item <view> won't cascade it (`enableCSSInheritance:
    // false`).
    ...colors.flatMap(color =>
      VARIANTS.map((variant) => {
        const { base, fg } = VARIANT_BUILDERS[variant](color)
        return {
          color,
          variant,
          class: { item: base, leadingIcon: fg, label: fg },
        }
      }),
    ),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'outline' as const,
    size: 'md' as const,
    orientation: 'horizontal' as const,
  },
})
