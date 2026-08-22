// Ported from nuxt/ui v3.0.2 `src/theme/alert.ts` — see `./button.ts` for the
// shared Lynx adaptations. Variants are restricted to `solid` / `outline` /
// `soft` / `subtle`.
import type { Color } from './colors'
import { type IconFg, iconFgFromToken } from './iconColor'

// Variant = structural treatment only (border / fill / nothing); the hue stays
// the same across variants. Use `border-*`, not `ring-*` — Lynx-native drops the
// ring's multi-var chain — and mimic translucent rings/fills with discrete
// shades, since the preset can't do opacity modifiers (`ring/25`→`-200`,
// `bg/10`→`-50`). See `theme/button.ts` for the full rationale.
//
// `enableCSSInheritance: false` — `variantClass` spreads `fg` onto the title / description / icon.
const solid = (c: string) =>
  ({ base: `bg-${c}-500`, fg: 'text-white' })

const outline = (c: string) =>
  ({ base: `bg-default border-2 border-solid border-${c}-200`, fg: `text-${c}-600` })

const subtle = (c: string) =>
  ({ base: `bg-${c}-50 border-2 border-solid border-${c}-200`, fg: `text-${c}-600` })

const soft = (c: string) =>
  ({ base: `bg-${c}-50`, fg: `text-${c}-600` })

const ghost = (c: string) =>
  ({ base: '', fg: `text-${c}-600` })

const VARIANT_BUILDERS = { solid, outline, subtle, soft, ghost } as const

export type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

const variantClass = (color: string, variant: Variant) => {
  const { base, fg } = VARIANT_BUILDERS[variant](color)
  return { root: base, title: fg, description: fg, icon: fg }
}

// Baked icon fill (see ./iconColor.ts). Derived from the same `fg` string the
// variant emits, so the class and the baked color can't drift.
export function iconFg(color: string, variant: Variant, isDark = false): IconFg {
  const { fg } = VARIANT_BUILDERS[variant](color)
  return iconFgFromToken(fg.match(/^text-(\S+)/)?.[1], isDark)
}

export default (colors: Color[]) => ({
  slots: {
    root: 'relative w-full rounded-lg p-4 flex flex-row gap-2.5',
    wrapper: 'min-w-0 flex-1 flex flex-col',
    title: 'text-sm font-medium',
    description: 'text-sm opacity-90',
    icon: 'shrink-0 size-5',
    actions: 'flex flex-row flex-wrap gap-1.5 shrink-0',
    close: 'p-0',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: Object.fromEntries(VARIANTS.map(v => [v, ''])) as Record<Variant, ''>,
    orientation: {
      horizontal: {
        root: 'items-center',
        actions: 'items-center',
      },
      vertical: {
        root: 'items-start',
        actions: 'items-start mt-2.5',
      },
    },
    title: {
      true: {
        description: 'mt-1',
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
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'solid' as const,
    orientation: 'vertical' as const,
  },
})
