// Ported from nuxt/ui v3.0.2 `src/theme/alert.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config (see `theme/button.ts`).
//
// Light-mode-only port — `dark:` / `focus-visible:` / `shadow-*` classes
// dropped. Variants restricted to `solid` / `outline` / `soft` / `subtle`.
import type { Color } from './colors'

// Variant = structural treatment only (border / fill / nothing).
// Color stays the same hue across variants — only the chosen color shifts.
// Use `border-*` (not `ring-*`); Lynx-native drops the ring's multi-var chain.
//
//   solid   = filled, no border         (text-white, bg accent)
//   outline = border only, no fill
//   subtle  = light border + light fill
//   soft    = light fill, no border
//   ghost   = nothing, color text only

// Translucent rings/fills are mimicked with discrete shades (the preset can't
// do opacity modifiers): nuxt's `ring/25`→`-200`, `bg/10`→`-50`. `border-2` →
// 1px in the kit preset (matches nuxt's 1px ring). Text uses the vibrant `-600`
// (nuxt's `text-primary`). See `theme/button.ts` for the full rationale.
//
// Surface (`base`: bg/border, applied to `root`) is kept separate from the
// foreground color (`fg`: text-*). CSS inheritance is OFF in the Lynx build
// (`enableCSSInheritance: false`), so `text-*` on `root` never reaches the
// title / description / icon — `variantClass` spreads `fg` onto those slots.
const solid = (c: string) =>
  ({ base: `bg-${c}-500`, fg: 'text-white' })

const outline = (c: string) =>
  ({ base: `bg-white border-2 border-solid border-${c}-200`, fg: `text-${c}-600` })

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

// Same Lynx constraint as `button.ts`'s `iconFg`: the `<svg>` rasterizes its
// XML, so the `text-*` class on the `icon` slot never reaches the glyph — the
// fill must be baked into the SVG via the Icon `color` prop (Alert.vue
// resolves it with `resolveColorHex`). Derive the fill from the same `fg`
// string the variant emits so class and baked color can't drift.
export function iconFg(color: string, variant: Variant): { semantic: string, shade: number } | 'white' {
  const { fg } = VARIANT_BUILDERS[variant](color)
  const match = fg.match(/^text-([a-z0-9-]+)-(\d+)/i)
  return match ? { semantic: match[1], shade: Number(match[2]) } : 'white'
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
