// Ported from nuxt/ui v3.0.2 `src/theme/button.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config:
//   --ui-color-primary-500: theme('colors.green.500'); etc.
// See `apps/examples/ui-demo/src/index.css` for the default mapping.
//
// Each builder emits classes against the semantic name directly — Tailwind
// treats `bg-primary-500` / `ring-error-500/25` as configured colors.

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

// Light-mode-only ports of Nuxt UI v3.0.2 variants. Dark mode + focus-visible
// classes are dropped (no dark mode plumbed, Lynx doesn't surface focus rings
// the way the DOM does).

// Variant = structural treatment only. Use `border-*` (Lynx drops `ring-*`).
const solid = (c: SemanticColor) =>
  `text-white bg-${c}-500 active:bg-${c}-600 active:bg-${c}-600`

const outline = (c: SemanticColor) =>
  `text-${c}-700 border-2 border-solid border-${c}-500 active:bg-${c}-50 active:bg-${c}-100`

const subtle = (c: SemanticColor) =>
  `text-${c}-700 border border-solid border-${c}-500 bg-${c}-100 active:bg-${c}-200 active:bg-${c}-200`

const soft = (c: SemanticColor) =>
  `text-${c}-700 bg-${c}-100 active:bg-${c}-200 active:bg-${c}-200`

const ghost = (c: SemanticColor) =>
  `text-${c}-700 active:bg-${c}-50 active:bg-${c}-100`

const link = (c: SemanticColor) =>
  `text-${c}-600 active:text-${c}-700 active:text-${c}-800 underline-offset-4 active:underline`

const VARIANT_BUILDERS = { solid, outline, soft, subtle, ghost, link } as const

type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

export default {
  slots: {
    base: 'rounded-md font-medium flex flex-row items-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    label: 'truncate',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    trailingIcon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
    variant: Object.fromEntries(VARIANTS.map(v => [v, ''])) as Record<Variant, ''>,
    size: {
      sm: {
        base: 'px-2.5 py-1.5 text-sm gap-1.5',
        leadingIcon: 'size-5',
        trailingIcon: 'size-5',
      },
      md: {
        base: 'px-3 py-2 text-sm gap-2',
        leadingIcon: 'size-5',
        trailingIcon: 'size-5',
      },
      lg: {
        base: 'px-3 py-2 text-base gap-2',
        leadingIcon: 'size-6',
        trailingIcon: 'size-6',
      },
      xl: {
        base: 'px-3.5 py-2.5 text-lg gap-2.5',
        leadingIcon: 'size-7',
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
    // color + variant -> concrete tailwind classes
    ...COLORS.flatMap(color =>
      VARIANTS.map(variant => ({
        color,
        variant,
        class: VARIANT_BUILDERS[variant](color),
      })),
    ),
    // square sizing (icon-only buttons drop horizontal padding for an even box)
    { size: 'sm' as const, square: true, class: { base: 'p-1.5' } },
    { size: 'md' as const, square: true, class: { base: 'p-2' } },
    { size: 'lg' as const, square: true, class: { base: 'p-2' } },
    { size: 'xl' as const, square: true, class: { base: 'p-2.5' } },
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'solid' as const,
    size: 'md' as const,
  },
}
