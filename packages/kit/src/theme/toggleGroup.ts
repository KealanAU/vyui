/**
 * ToggleGroup theme — modelled on a segmented-control / button-group adapted
 * from nuxt/ui v3.0.2 conventions (`theme/button.ts` variant matrix, plus
 * `theme/button-group.ts` orientation rounding). Light-only port for Vue-Lynx.
 *
 * Each item renders a `ToggleGroupItem` styled like a button; the
 * `data-[state=on]` attribute is used to flip into the active appearance per
 * color × variant. Variants supported: `outline`, `soft`, `subtle` (matches
 * what nuxt/ui surfaces for non-solid toggles).
 */
import type { Color } from './colors'

// Each builder returns the *inactive* + *on-state* classes for an item.
const outline = (c: string) =>
  `text-neutral-700 border border-neutral-300 bg-white active:bg-${c}-50 active:bg-${c}-100`
    + ` data-[state=on]:text-${c}-600 data-[state=on]:border-${c}-500 data-[state=on]:bg-${c}-50`

const soft = (c: string) =>
  `text-neutral-700 bg-neutral-100 active:bg-${c}-50 active:bg-${c}-100`
    + ` data-[state=on]:text-${c}-600 data-[state=on]:bg-${c}-100`

const subtle = (c: string) =>
  `text-neutral-700 border border-neutral-200 bg-white active:bg-${c}-50 active:bg-${c}-100`
    + ` data-[state=on]:text-${c}-600 data-[state=on]:border-${c}-300 data-[state=on]:bg-${c}-100`

const VARIANT_BUILDERS = { outline, soft, subtle } as const

type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

export default (colors: Color[]) => ({
  slots: {
    // `root` direction is set per orientation variant (flex-row/flex-col).
    root: 'flex',
    item: 'flex flex-row items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
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
        root: 'flex-row -space-x-px',
        item: 'first:rounded-s-md last:rounded-e-md',
      },
      vertical: {
        root: 'flex-col -space-y-px',
        item: 'first:rounded-t-md last:rounded-b-md w-full',
      },
    },
  },
  compoundVariants: [
    ...colors.flatMap(color =>
      VARIANTS.map(variant => ({
        color,
        variant,
        class: { item: VARIANT_BUILDERS[variant](color) },
      })),
    ),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'outline' as const,
    size: 'md' as const,
    orientation: 'horizontal' as const,
  },
})
