// Ported from nuxt/ui v4 `src/theme/button.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to palettes via the
// consuming app's CSS variables and Tailwind config, so each builder can emit
// `bg-primary-500` / `border-error-200` directly.
//
// Deliberate Lynx adaptations:
//   • No `hover:` / `focus-visible:` — Lynx has no hover/focus-ring plumbing, so
//     interactive feedback uses `active:` only.
//   • No `ring-*` — use `border-*` (the preset maps `border-2` → 1px).
//   • No opacity color modifiers — colors are wired to raw `var()` hex, so
//     `bg-primary/10` can't work; discrete shades stand in (`/10`→`-50`, …).
//   • Dark mode rides the semantic tokens, not `dark:` variants.
//   • `flex flex-row` instead of `inline-flex` (Lynx flex defaults differ).
//
// The default export is a builder `(colors: Color[]) => themeObject`, threaded
// in by `useStyledComponent` from `appConfig.ui.colors`, so adding a color at
// runtime emits its variants without editing this file.
import type { Color } from './colors'
import { NEUTRAL } from './color-constants'
import { type IconFg, iconFgFromToken } from './iconColor'

// Each variant returns the surface classes (`base`) separately from the
// foreground color (`fg`). CSS inheritance is OFF in the Lynx build, so a
// `text-*` on the root <view> does NOT reach the label <text> or the icons —
// `variantClass` spreads `fg` onto the text-bearing slots.

// ── Chromatic colors (primary / secondary / success / info / warning / error) ─
// Text uses the vibrant `-600` (mimics nuxt's `text-primary` ≈ 500-level) so
// non-solid buttons read as colored, not muddy. Solid keeps white text.
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

// ── Neutral ─────────────────────────────────────────────────────────────────
// Non-solid variants ride the semantic tokens so they flip in dark for free;
// `solid` uses the high-contrast `bg-inverted` + `text-inverted` pair. A style
// re-skins all of them at once via `baseColor`.
const neutralVariants = {
  solid: { base: 'bg-inverted active:opacity-90', fg: 'text-inverted' },
  outline: { base: 'border-2 border-solid border-accented active:bg-elevated', fg: 'text-default' },
  subtle: { base: 'border-2 border-solid border-default bg-elevated active:bg-accented', fg: 'text-default' },
  soft: { base: 'bg-elevated active:bg-accented', fg: 'text-default' },
  ghost: { base: 'active:bg-elevated', fg: 'text-default' },
  link: { base: '', fg: 'text-muted active:text-default' },
} as const

const VARIANT_BUILDERS = { solid, outline, soft, subtle, ghost, link } as const

export type Variant = keyof typeof VARIANT_BUILDERS

const VARIANTS = Object.keys(VARIANT_BUILDERS) as Variant[]

// Surface on `base`; foreground color spread onto every text-bearing slot
// (label + icons) since Lynx won't inherit it from the root.
const variantClass = (color: string, variant: Variant) => {
  const { base, fg } = color === NEUTRAL ? neutralVariants[variant] : VARIANT_BUILDERS[variant](color)
  return { base, label: fg, leadingIcon: fg, trailingIcon: fg }
}

// The `text-*` classes above reach the label `<text>` but not the icons — Lynx's
// `<svg>` rasterizes its XML, so the fill must be baked in via the Icon `color`
// prop. Derive it from the same `fg` string the variant emits so class and baked
// color can't drift. Neutral variants emit mode-dependent semantic TOKENS, so
// `isDark` is passed through (`iconFgFromToken`).
export function iconFg(color: string, variant: Variant, isDark = false): IconFg {
  const { fg } = color === NEUTRAL ? neutralVariants[variant] : VARIANT_BUILDERS[variant](color)
  return iconFgFromToken(fg.match(/^text-(\S+)/)?.[1], isDark)
}

// `import type { Color }` keeps the record typed to the DEFAULT semantic union,
// so `color?` props autocomplete against the standard set. The codegen plugin
// regenerates this file with the consumer's configured union.
export default (colors: Color[]) => ({
  slots: {
    base: 'min-w-0 max-w-full rounded-md font-medium flex flex-row items-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    label: 'min-w-0 truncate',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    // Not a class — holds the `<VyAvatar size>` token for the active size.
    // Avatar's smallest size is `xs` (32px), so small buttons can't shrink it.
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
    // Icon-only: kill the flex gap and center. vue-lynx realizes slot/v-if
    // comment anchors as real zero-size nodes, so empty label/trailing slots
    // still count as flex items and a `gap-*` pushes the icon off-center.
    square: {
      true: {
        base: 'justify-center gap-0',
      },
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
    color: 'primary' as const,
    variant: 'solid' as const,
    size: 'md' as const,
  },
})
