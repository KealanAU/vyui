/**
 * Toggle theme — single boolean pressed-state button. Adapted from nuxt/ui
 * v3.0.2 `theme/button.ts` variant matrix, narrowed to the variants that make
 * sense for a two-state toggle (`solid`, `outline`, `soft`, `ghost`).
 *
 * Off state uses a neutral hover/active treatment regardless of color so the
 * pressed state can convey the color × variant emphasis on its own.
 *
 * Surface (`base`: bg/border on the root <view>) is kept separate from the
 * foreground color (`fg`: text-*). CSS inheritance is OFF in the Lynx build
 * (`enableCSSInheritance: false`), so a `text-*` on the root <view> never
 * reaches the `icon` <VyIcon> child — `fg` is spread onto the `icon` slot.
 * Same convention as `button.ts`.
 */
import type { Color } from './colors'
import { type IconFg, iconFgFromToken } from './iconColor'

const solid = (c: string) =>
  ({ base: `bg-${c}-500 active:bg-${c}-600 active:bg-${c}-600`, fg: 'text-white' })

const outline = (c: string) =>
  ({ base: `border border-${c}-300 active:bg-${c}-50 active:bg-${c}-100`, fg: `text-${c}-500` })

const soft = (c: string) =>
  ({ base: `bg-${c}-100 active:bg-${c}-100 active:bg-${c}-200`, fg: `text-${c}-500` })

// The pressed surface has to REST on screen, not only under a finger: an
// `active:` -only ghost is invisible the moment the tap ends, which left the
// default variant with no on-state at all. Mirrors ToggleGroup's `ui-on:bg-50`.
const ghost = (c: string) =>
  ({ base: `bg-${c}-50 active:bg-${c}-100`, fg: `text-${c}-500` })

const VARIANT_BUILDERS = { solid, outline, soft, ghost } as const

export type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

// Same Lynx constraint as `button.ts` / `toggleGroup.ts`: the `<svg>` rasterizes
// its XML, so neither the pressed `text-{color}-500` nor the resting
// `text-default` on the `icon` slot ever reaches the glyph — Toggle.vue bakes
// the fill from the same `fg` strings so class and baked color can't drift.
export function iconFg(color: string, variant: Variant, pressed: boolean, isDark = false): IconFg {
  const suffix = pressed
    ? VARIANT_BUILDERS[variant](color).fg.match(/^text-(\S+)/)?.[1]
    : 'default'
  return iconFgFromToken(suffix, isDark)
}

export default (colors: Color[]) => ({
  slots: {
    base: 'min-w-0 max-w-full rounded-md font-medium flex flex-row items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    icon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    variant: Object.fromEntries(VARIANTS.map(v => [v, ''])) as Record<Variant, ''>,
    size: {
      sm: { base: 'px-2.5 py-1.5 text-sm gap-1.5', icon: 'size-5' },
      md: { base: 'px-3 py-2 text-sm gap-2', icon: 'size-5' },
      lg: { base: 'px-3 py-2 text-base gap-2', icon: 'size-6' },
      xl: { base: 'px-3.5 py-2.5 text-lg gap-2.5', icon: 'size-7' },
    },
    pressed: {
      true: '',
      // `text-*` must sit on the `icon` slot too — the root <view> won't
      // cascade it to the icon (`enableCSSInheritance: false`).
      false: { base: 'active:bg-elevated active:bg-accented', icon: 'text-default' },
    },
  },
  compoundVariants: [
    // pressed × color × variant -> concrete tailwind classes for the active look.
    // Surface lands on `base`; foreground color (`fg`) on `icon` since the root
    // <view> won't cascade it (`enableCSSInheritance: false`).
    ...colors.flatMap(color =>
      VARIANTS.map((variant) => {
        const { base, fg } = VARIANT_BUILDERS[variant](color)
        return {
          pressed: true as const,
          color,
          variant,
          class: { base, icon: fg },
        }
      }),
    ),
  ],
  defaultVariants: {
    color: 'primary' as const,
    variant: 'ghost' as const,
    size: 'md' as const,
  },
})
