// `shadcn` style — button theme overlay (full-file override of the base).
//
// Identical to the default @vyui/kit button theme EXCEPT the default `color` is
// `neutral` instead of `primary`: shadcn's signature button is the near-black
// solid (`bg-neutral-900 text-white`), which the base `neutralVariants.solid`
// already produces. Everything else (variant builders, sizes, the `iconFg`
// export consumed by Button.vue) is preserved so the SFC contract is unchanged.
//
// This is the "escape hatch" layer: a default-color change can't be expressed
// at the token layer, so it lives in a theme overlay. See the base
// `packages/kit/src/theme/button.ts` for the full rationale on each builder.
import type { Color } from './colors'
import { NEUTRAL } from './color-constants'

const solid = (c: string) =>
  ({ base: `bg-${c}-500 active:bg-${c}-600`, fg: 'text-white' })

const outline = (c: string) =>
  ({ base: `border-2 border-solid border-${c}-300 active:bg-${c}-50`, fg: `text-${c}-600` })

const subtle = (c: string) =>
  ({ base: `border-2 border-solid border-${c}-200 bg-${c}-50 active:bg-${c}-100`, fg: `text-${c}-600` })

const soft = (c: string) =>
  ({ base: `bg-${c}-50 active:bg-${c}-100`, fg: `text-${c}-600` })

const ghost = (c: string) =>
  ({ base: `active:bg-${c}-50`, fg: `text-${c}-600` })

const link = (c: string) =>
  ({ base: '', fg: `text-${c}-600 active:text-${c}-700` })

const neutralVariants = {
  solid: { base: 'bg-neutral-900 active:bg-neutral-800', fg: 'text-white' },
  outline: { base: 'border-2 border-solid border-neutral-300 active:bg-neutral-100', fg: 'text-neutral-700' },
  subtle: { base: 'border-2 border-solid border-neutral-200 bg-neutral-100 active:bg-neutral-200', fg: 'text-neutral-700' },
  soft: { base: 'bg-neutral-100 active:bg-neutral-200', fg: 'text-neutral-700' },
  ghost: { base: 'active:bg-neutral-100', fg: 'text-neutral-700' },
  link: { base: '', fg: 'text-neutral-500 active:text-neutral-700' },
} as const

const VARIANT_BUILDERS = { solid, outline, soft, subtle, ghost, link } as const

export type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

const variantClass = (color: string, variant: Variant) => {
  const { base, fg } = color === NEUTRAL ? neutralVariants[variant] : VARIANT_BUILDERS[variant](color)
  return { base, label: fg, leadingIcon: fg, trailingIcon: fg }
}

export function iconFg(color: string, variant: Variant): { semantic: string, shade: number } | 'white' {
  const { fg } = color === NEUTRAL ? neutralVariants[variant] : VARIANT_BUILDERS[variant](color)
  const match = fg.match(/^text-([a-z0-9-]+)-(\d+)/i)
  return match ? { semantic: match[1], shade: Number(match[2]) } : 'white'
}

export default (colors: Color[]) => ({
  slots: {
    base: 'min-w-0 max-w-full rounded-md font-medium flex flex-row items-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    label: 'min-w-0 truncate',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailingIcon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: Object.fromEntries(VARIANTS.map(v => [v, ''])) as Record<Variant, ''>,
    size: {
      xs: {
        base: 'px-2 py-1 text-xs gap-1',
        leadingIcon: 'size-4',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-4',
      },
      sm: {
        base: 'px-2.5 py-1.5 text-sm gap-1.5',
        leadingIcon: 'size-5',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-5',
      },
      md: {
        base: 'px-3 py-2 text-sm gap-2',
        leadingIcon: 'size-5',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-5',
      },
      lg: {
        base: 'px-3 py-2 text-base gap-2',
        leadingIcon: 'size-6',
        leadingAvatarSize: 'sm',
        trailingIcon: 'size-6',
      },
      xl: {
        base: 'px-3.5 py-2.5 text-lg gap-2.5',
        leadingIcon: 'size-7',
        leadingAvatarSize: 'sm',
        trailingIcon: 'size-7',
      },
    },
    block: {
      true: {
        base: 'w-full justify-center',
        trailingIcon: 'ms-auto',
      },
    },
    square: {
      true: '',
    },
    loading: {
      true: {
        leadingIcon: 'animate-spin',
        trailingIcon: 'animate-spin',
      },
    },
  },
  compoundVariants: [
    ...colors.flatMap(color =>
      VARIANTS.map(variant => ({
        color,
        variant,
        class: variantClass(color, variant),
      })),
    ),
    { size: 'xs' as const, square: true, class: { base: 'p-1' } },
    { size: 'sm' as const, square: true, class: { base: 'p-1.5' } },
    { size: 'md' as const, square: true, class: { base: 'p-2' } },
    { size: 'lg' as const, square: true, class: { base: 'p-2' } },
    { size: 'xl' as const, square: true, class: { base: 'p-2.5' } },
  ],
  defaultVariants: {
    color: 'neutral' as const,
    variant: 'solid' as const,
    size: 'md' as const,
  },
})
