// Ported from nuxt/ui v4 `src/theme/badge.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config (see `theme/button.ts`).
//
// Light-mode-only port — `dark:` and `focus-visible:` classes are dropped.
// Variants restricted to `solid`/`outline`/`soft`/`subtle` (no `ghost`/`link`).

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

// Variant = structural treatment only. Use `border-*` (Lynx drops `ring-*`).
const solid = (c: SemanticColor) =>
  `text-white bg-${c}-500`

const outline = (c: SemanticColor) =>
  `text-${c}-700 border-2 border-solid border-${c}-500`

const subtle = (c: SemanticColor) =>
  `text-${c}-700 border border-solid border-${c}-500 bg-${c}-100`

const soft = (c: SemanticColor) =>
  `text-${c}-700 bg-${c}-100`

const VARIANT_BUILDERS = { solid, outline, soft, subtle } as const

type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

export default {
  slots: {
    base: 'font-medium flex flex-row items-center rounded-md',
    label: 'truncate',
    leadingIcon: 'shrink-0',
    trailingIcon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
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
    // color + variant -> concrete tailwind classes
    ...COLORS.flatMap(color =>
      VARIANTS.map(variant => ({
        color,
        variant,
        class: VARIANT_BUILDERS[variant](color),
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
}
