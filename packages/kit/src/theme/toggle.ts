/**
 * Toggle theme — single boolean pressed-state button. Adapted from nuxt/ui
 * v3.0.2 `theme/button.ts` variant matrix, narrowed to the variants that make
 * sense for a two-state toggle (`solid`, `outline`, `soft`, `ghost`).
 *
 * Off state uses a neutral hover/active treatment regardless of color so the
 * pressed state can convey the color × variant emphasis on its own.
 */
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

const solid = (c: SemanticColor) =>
  `text-white bg-${c}-500 active:bg-${c}-600 active:bg-${c}-600`

const outline = (c: SemanticColor) =>
  `text-${c}-500 border border-${c}-300 active:bg-${c}-50 active:bg-${c}-100`

const soft = (c: SemanticColor) =>
  `text-${c}-500 bg-${c}-50 active:bg-${c}-100 active:bg-${c}-200`

const ghost = (c: SemanticColor) =>
  `text-${c}-500 active:bg-${c}-50 active:bg-${c}-100`

const VARIANT_BUILDERS = { solid, outline, soft, ghost } as const

type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

export default {
  slots: {
    base: 'rounded-md font-medium flex flex-row items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    icon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
    variant: Object.fromEntries(VARIANTS.map(v => [v, ''])) as Record<Variant, ''>,
    size: {
      sm: { base: 'px-2.5 py-1.5 text-sm gap-1.5', icon: 'size-5' },
      md: { base: 'px-3 py-2 text-sm gap-2', icon: 'size-5' },
      lg: { base: 'px-3 py-2 text-base gap-2', icon: 'size-6' },
      xl: { base: 'px-3.5 py-2.5 text-lg gap-2.5', icon: 'size-7' },
    },
    pressed: {
      true: '',
      false: { base: 'text-neutral-700 active:bg-neutral-100 active:bg-neutral-200' },
    },
  },
  compoundVariants: [
    // pressed × color × variant -> concrete tailwind classes for the active look
    ...COLORS.flatMap(color =>
      VARIANTS.map(variant => ({
        pressed: true as const,
        color,
        variant,
        class: { base: VARIANT_BUILDERS[variant](color) },
      })),
    ),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'ghost' as const,
    size: 'md' as const,
  },
}
