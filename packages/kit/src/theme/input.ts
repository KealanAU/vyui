// Ported from nuxt/ui v3.0.2 `src/theme/input.ts`. Semantic color names resolve
// via CSS variables defined in the consuming app.
//
// Lynx adaptation: `ring-*` → `border-*` plus a flat arbitrary `box-shadow`
// focus ring (no ringWidth plugin in `@lynx-js/tailwind-preset`), `inline-flex`
// → `flex`, and — most importantly — leading / trailing slots are **inline
// siblings** of the `<input>` rather than absolutely-positioned overlays: Lynx's
// layout engine doesn't reliably overlay `position: absolute` children on a
// sibling `<input>`, so border + background live on `root` and the input sits
// transparent between the two icon wrappers.
//
// Inline `as const` on literal values is required so tailwind-variants can
// narrow `compoundVariants` entries to the variant union types.

import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    // Border + bg + radius live on root; base stays transparent so the icon
    // wrappers (siblings) sit *inside* the rounded chrome.
    root: 'flex flex-row items-center w-full rounded-md transition-colors',
    // Typed-text color sits on `base` (the <input>), not `root`: CSS inheritance
    // is OFF in the Lynx build, so a root `text-*` never reaches the input.
    base: 'flex-1 min-w-0 bg-transparent text-highlighted placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75',
    leading: 'flex flex-row items-center shrink-0',
    leadingIcon: 'shrink-0 text-dimmed',
    leadingAvatar: 'shrink-0',
    trailing: 'flex flex-row items-center shrink-0',
    trailingIcon: 'shrink-0 text-dimmed'
  },
  variants: {
    size: {
      sm: {
        root: 'px-2.5 gap-2',
        base: 'py-1.5 text-sm',
        leadingIcon: 'size-5',
        trailingIcon: 'size-5'
      },
      md: {
        root: 'px-3 gap-2',
        base: 'py-2 text-sm',
        leadingIcon: 'size-5',
        trailingIcon: 'size-5'
      },
      lg: {
        root: 'px-3 gap-2.5',
        base: 'py-2 text-base',
        leadingIcon: 'size-6',
        trailingIcon: 'size-6'
      },
      xl: {
        root: 'px-3.5 gap-3',
        base: 'py-2.5 text-lg',
        leadingIcon: 'size-7',
        trailingIcon: 'size-7'
      }
    },
    variant: {
      outline: { root: 'bg-default border border-default' },
      soft: { root: 'bg-muted active:bg-elevated disabled:bg-muted' },
      subtle: { root: 'bg-elevated border border-default' },
      ghost: { root: 'bg-transparent active:bg-elevated disabled:bg-transparent' },
      none: { root: 'bg-transparent' }
    },
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    leading: { true: '' },
    trailing: { true: '' },
    loading: { true: '' },
    highlight: { true: '' }
  },
  compoundVariants: [
    // Resting border is neutral; the colored border + shadow ring paints while
    // focused (tracked in JS by `Input.vue` — Lynx has no `:focus-within`) or
    // statically via `highlight`. The ring is a flat arbitrary box-shadow: the
    // Lynx preset has no `ring*` plugins, but `shadow-*` emits a plain
    // `box-shadow` and `--ui-color-*-200` holds a concrete value, so the single
    // var() level survives Lynx's one-level resolution. Template-literal class —
    // safelisted in `../tailwind.js` (keep the two in sync).
    ...colors.map(c => ({
      color: c,
      highlight: true,
      class: { root: `border border-${c}-500 shadow-[0_0_0_2px_var(--ui-color-${c}-200)]` }
    })),
    // Icons default to neutral (dimmed), decoupled from `color`; override via
    // the `leading` / `trailing` slots. Loading spinner animates the icon slot.
    { loading: true, leading: true, class: { leadingIcon: 'animate-spin' } },
    { loading: true, leading: false, trailing: true, class: { trailingIcon: 'animate-spin' } }
  ],
  defaultVariants: {
    size: 'md' as const,
    variant: 'outline' as const,
    color: 'primary' as const
  }
})
