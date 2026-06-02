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
    base: 'flex-1 min-w-0 bg-transparent placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75',
    leading: 'flex flex-row items-center shrink-0',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    trailing: 'flex flex-row items-center shrink-0',
    trailingIcon: 'shrink-0'
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
      outline: { root: 'text-neutral-900 bg-white border' },
      soft: { root: 'text-neutral-900 bg-neutral-100/50 active:bg-neutral-100 disabled:bg-neutral-100/50' },
      subtle: { root: 'text-neutral-900 bg-neutral-100 border' },
      ghost: { root: 'text-neutral-900 bg-transparent active:bg-neutral-100 disabled:bg-transparent' },
      none: { root: 'text-neutral-900 bg-transparent' }
    },
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    leading: { true: '' },
    trailing: { true: '' },
    loading: { true: '' },
    highlight: { true: '' }
  },
  compoundVariants: [
    // Border colors live on `root` since the chrome moved off `base`.
    ...colors.flatMap(c => [
      { color: c, variant: 'outline' as const, class: { root: `border-${c}-500` } },
      { color: c, variant: 'subtle' as const, class: { root: `border-${c}-500` } }
    ]),
    // `highlight` paints a static border matching the color (no focus needed).
    ...colors.map(c => ({
      color: c,
      highlight: true,
      class: { root: `border border-${c}-500` }
    })),
    // Theme-driven icon color class (kept for web/CSS-var palette swap; Lynx
    // SVG fill colors are baked via the `:color` prop on `<VyIcon>` from the
    // component, since Lynx rasterizes SVG XML and can't inherit currentColor).
    ...colors.map(c => ({
      color: c,
      class: {
        leadingIcon: `text-${c}-500`,
        trailingIcon: `text-${c}-500`
      }
    })),
    // Loading spinner animation lives on the icon slot, not the wrapper.
    { loading: true, leading: true, class: { leadingIcon: 'animate-spin' } },
    { loading: true, leading: false, trailing: true, class: { trailingIcon: 'animate-spin' } }
  ],
  defaultVariants: {
    size: 'md' as const,
    variant: 'outline' as const,
    color: 'primary' as const
  }
})
