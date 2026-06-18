// Ported from nuxt/ui v3.0.2 `src/theme/input.ts`. Uses semantic color names
// (`border-primary-500`) which Tailwind resolves via CSS variables defined in
// the consuming app — see `apps/examples/kit-demo/src/index.css`.
//
// Lynx adaptation: `ring-*` → `border-*` (no ringWidth plugin in
// `@lynx-js/tailwind-preset`), `inline-flex` → `flex` (Lynx strips
// inline-flex), and — most importantly — leading / trailing slots are
// **inline siblings** of the underlying `<input>` rather than absolutely-
// positioned overlays. Lynx's layout engine doesn't reliably overlay
// `position: absolute` children on top of a sibling `<input>` (the icons
// stack visually instead of sitting inside the rounded border), so we put
// border + background on `root` and let the input live transparent between
// the two icon wrappers.
//
// Inline `as const` on literal values is required so tailwind-variants can
// narrow `compoundVariants` entries to the variant union types — matches the
// convention used by `./switch` and `./button`.

import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    // Border + bg + radius live on root; base stays transparent so the icon
    // wrappers (siblings) sit *inside* the rounded chrome.
    root: 'flex flex-row items-center w-full rounded-md transition-colors',
    // Typed-text color sits on `base` (the <input>), not `root`: CSS
    // inheritance is OFF in the Lynx build (`enableCSSInheritance: false`), so a
    // `text-*` on the root <view> never reaches the input element.
    base: 'flex-1 min-w-0 bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75',
    leading: 'flex flex-row items-center shrink-0',
    leadingIcon: 'shrink-0 text-neutral-400',
    leadingAvatar: 'shrink-0',
    trailing: 'flex flex-row items-center shrink-0',
    trailingIcon: 'shrink-0 text-neutral-400'
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
    // Surface only (bg/border) on `root`; typed-text color lives on `base`
    // (the <input>) — see the `slots.base` note re `enableCSSInheritance: false`.
    variant: {
      outline: { root: 'bg-white border border-neutral-200' },
      soft: { root: 'bg-neutral-100/50 active:bg-neutral-100 disabled:bg-neutral-100/50' },
      subtle: { root: 'bg-neutral-100 border border-neutral-200' },
      ghost: { root: 'bg-transparent active:bg-neutral-100 disabled:bg-transparent' },
      none: { root: 'bg-transparent' }
    },
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    leading: { true: '' },
    trailing: { true: '' },
    loading: { true: '' },
    highlight: { true: '' }
  },
  compoundVariants: [
    // Resting border is neutral; the colored border is opt-in via `highlight`
    // (no focus state on Lynx).
    ...colors.map(c => ({
      color: c,
      highlight: true,
      class: { root: `border border-${c}-500` }
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
