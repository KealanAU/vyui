// Ported from nuxt/ui v4 `src/theme/badge.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config (see `theme/button.ts`).
//
// Light-mode-only port — `dark:` and `focus-visible:` classes are dropped.
// Variants restricted to `solid`/`outline`/`soft`/`subtle` (no `ghost`/`link`).
import type { Color } from './colors'

// Variant = structural treatment only. Use `border-*` (Lynx drops `ring-*`;
// `border-2` → 1px in the kit preset, matching nuxt's 1px ring). Nuxt's
// translucent rings/fills are mimicked with discrete shades since the preset
// can't do opacity modifiers: `/25`→`-200`, `/10`→`-50`. Text uses the vibrant
// `-600` (nuxt's `text-primary`) so colored badges read as colored. See
// `theme/button.ts` for the full rationale.
//
// Surface (`base`: bg/border) is kept separate from the foreground color (`fg`:
// text-*). CSS inheritance is OFF in the Lynx build (`enableCSSInheritance:
// false`), so `text-*` on the root <view> never reaches the label <text> or
// icons — `variantClass` spreads `fg` onto those slots directly.
const solid = (c: string) =>
  ({ base: `bg-${c}-500`, fg: 'text-white' })

const outline = (c: string) =>
  ({ base: `border-2 border-solid border-${c}-200`, fg: `text-${c}-600` })

const subtle = (c: string) =>
  ({ base: `border-2 border-solid border-${c}-200 bg-${c}-50`, fg: `text-${c}-600` })

const soft = (c: string) =>
  ({ base: `bg-${c}-50`, fg: `text-${c}-600` })

const VARIANT_BUILDERS = { solid, outline, soft, subtle } as const

type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

const variantClass = (color: string, variant: Variant) => {
  const { base, fg } = VARIANT_BUILDERS[variant](color)
  return { base, label: fg, leadingIcon: fg, trailingIcon: fg }
}

export default (colors: Color[]) => ({
  slots: {
    base: 'font-medium flex flex-row items-center rounded-md',
    label: 'truncate',
    leadingIcon: 'shrink-0',
    trailingIcon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: Object.fromEntries(VARIANTS.map(v => [v, ''])) as Record<Variant, ''>,
    size: {
      sm: {
        base: 'text-xs px-2 py-1 gap-1',
        leadingIcon: 'size-4',
        trailingIcon: 'size-4',
      },
      md: {
        base: 'text-sm px-2 py-1 gap-1.5',
        leadingIcon: 'size-4',
        trailingIcon: 'size-4',
      },
      lg: {
        base: 'text-base px-2.5 py-1 gap-1.5',
        leadingIcon: 'size-5',
        trailingIcon: 'size-5',
      },
      xl: {
        base: 'text-lg px-3 py-1.5 gap-2',
        leadingIcon: 'size-6',
        trailingIcon: 'size-6',
      },
    },
    square: {
      true: '',
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
    // square sizing (icon-only badges drop horizontal padding for an even box)
    { size: 'sm' as const, square: true, class: { base: 'p-1' } },
    { size: 'md' as const, square: true, class: { base: 'p-1' } },
    { size: 'lg' as const, square: true, class: { base: 'p-1' } },
    { size: 'xl' as const, square: true, class: { base: 'p-1.5' } },
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'solid' as const,
    size: 'md' as const,
  },
})
