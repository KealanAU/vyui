// Ported from nuxt/ui v3.0.2 `src/theme/alert.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config (see `theme/button.ts`).
//
// Light-mode-only port — `dark:` / `focus-visible:` / `shadow-*` classes
// dropped. Variants restricted to `solid` / `outline` / `soft` / `subtle`.

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

// Variant = structural treatment only (border / fill / nothing).
// Color stays the same hue across variants — only the chosen color shifts.
// Use `border-*` (not `ring-*`); Lynx-native drops the ring's multi-var chain.
//
//   solid   = filled, no border         (text-white, bg accent)
//   outline = border only, no fill
//   subtle  = light border + light fill
//   soft    = light fill, no border
//   ghost   = nothing, color text only

const solid = (c: SemanticColor) =>
  `text-white bg-${c}-500`

const outline = (c: SemanticColor) =>
  `text-${c}-700 bg-white border-2 border-solid border-${c}-500`

const subtle = (c: SemanticColor) =>
  `text-${c}-700 bg-${c}-100 border border-solid border-${c}-500`

const soft = (c: SemanticColor) =>
  `text-${c}-700 bg-${c}-100`

const ghost = (c: SemanticColor) =>
  `text-${c}-700`

const VARIANT_BUILDERS = { solid, outline, subtle, soft, ghost } as const

type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

export default {
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
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
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
    ...COLORS.flatMap(color =>
      VARIANTS.map(variant => ({
        color,
        variant,
        class: { root: VARIANT_BUILDERS[variant](color) },
      })),
    ),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'solid' as const,
    orientation: 'vertical' as const,
  },
}
