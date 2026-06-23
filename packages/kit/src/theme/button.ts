// Ported from nuxt/ui v4 `src/theme/button.ts` and adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config:
//   --ui-color-primary-500: theme('colors.green.500'); etc.
// See `apps/examples/kit-demo/src/index.css` for the default mapping.
//
// Each builder emits classes against the semantic name directly — Tailwind
// treats `bg-primary-500` / `border-error-200` as configured colors.
//
// ── DIFFERENCES FROM NUXT (deliberate Lynx adaptations) ─────────────────────
//   • No `hover:` / `focus-visible:` — Lynx has no hover/focus-ring plumbing, so
//     interactive feedback uses `active:` only.
//   • No `ring-*` — Lynx drops ring utilities; use `border-*` instead (the kit
//     preset maps `border-2` → 1px so it matches nuxt's 1px ring weight).
//   • No opacity color modifiers — the preset wires colors to raw `var()` hex,
//     so `bg-primary/10` can't work. Nuxt's translucent fills/rings are mimicked
//     with discrete shades: `/10`→`-50`, `/15`→`-100`, `/50`→`-300`, `/25`→`-200`.
//   • No dark mode.
//   • `flex flex-row` instead of `inline-flex` (Lynx flex defaults differ).
//
// ── BUILDER THEME (canonical template) ──────────────────────────────────────
// The default export is a builder `(colors: Color[]) => themeObject`. The
// `colors` list (configurable semantic colors + neutral) is threaded in by
// `useStyledComponent` from `appConfig.ui.colors`, so adding a color at runtime
// emits its variants without editing this file. Variant builders take a plain
// `string` color; there is no local `COLORS` const or closed `SemanticColor`
// union to keep in sync.
import type { Color } from './colors'
import { NEUTRAL } from './color-constants'

// Each variant returns the surface classes (`base`: bg/border, applied to the
// root <view>) separately from the foreground color (`fg`: text-*). CSS
// inheritance is OFF in the Lynx build (`enableCSSInheritance: false`), so a
// `text-*` on the root <view> does NOT reach the label <text> or the icons —
// the color must sit on those slots directly. Same convention as `avatar.ts` /
// `actionSheet.ts`. `variantClass` spreads `fg` onto the text-bearing slots.

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
// Nuxt treats neutral specially: solid is near-black, the rest sit on
// default/elevated/accented surfaces. On Lynx the Tailwind preset only emits
// `theme.colors` utilities (no semantic surface utilities like `bg-elevated`),
// so map onto the neutral ramp directly. A style re-skins these by overriding
// the `--ui-color-neutral-*` ramp (the `--base-color` mechanism).
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

// Surface on `base`; foreground color spread onto every text-bearing slot
// (label + icons) since Lynx won't inherit it from the root.
const variantClass = (color: string, variant: Variant) => {
  const { base, fg } = color === NEUTRAL ? neutralVariants[variant] : VARIANT_BUILDERS[variant](color)
  return { base, label: fg, leadingIcon: fg, trailingIcon: fg }
}

// The `text-*` classes above reach the label `<text>`, but not the icons —
// Lynx's `<svg>` rasterizes its XML, so CSS color never makes it into the
// glyph and the fill must be baked into the SVG via the Icon `color` prop
// (Button.vue resolves it with `resolveColorHex`). Derive the fill from the
// same `fg` string the variant emits so class and baked color can't drift.
// `link`'s `active:` shade shift is class-only and doesn't reach the icon.
export function iconFg(color: string, variant: Variant): { semantic: string, shade: number } | 'white' {
  const { fg } = color === NEUTRAL ? neutralVariants[variant] : VARIANT_BUILDERS[variant](color)
  const match = fg.match(/^text-([a-z0-9-]+)-(\d+)/i)
  return match ? { semantic: match[1], shade: Number(match[2]) } : 'white'
}

// `import type { Color }` keeps the color record typed to the DEFAULT semantic
// union, so `color?` props autocomplete + typo-check the standard set without
// any component edits. The codegen plugin regenerates this file with the
// consumer's exact configured union when custom colors are added (true parity).
export default (colors: Color[]) => ({
  slots: {
    base: 'min-w-0 max-w-full rounded-md font-medium flex flex-row items-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors',
    label: 'min-w-0 truncate',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    // Not a class — holds the `<VyAvatar size>` token for the active size (read
    // by Button.vue, mirrors nuxt's `leadingAvatarSize` slot). Avatar's smallest
    // size is `xs` (32px), so small buttons can't shrink the avatar further
    // until `2xs`/`3xs` are added to the Avatar theme.
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
    // square sizing (icon-only buttons drop horizontal padding for an even box)
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
