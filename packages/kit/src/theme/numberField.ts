// Styled NumberField — composes the core NumberField parts (stepper buttons +
// numeric input) into a single bordered control. Adapted for Vue-Lynx.
//
// Semantic color names (`primary`, `error`, …) resolve to actual palettes via
// the consuming app's CSS variables and Tailwind config — see
// `apps/examples/kit-demo/src/index.css`.
//
// Lynx adaptation mirrors `./input`: border + bg + radius live on `root`, the
// inner `<input>` (`base`) stays transparent and sits between the two stepper
// buttons. `ring-*` → `border-*` (no ringWidth plugin in the Lynx preset).

import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'flex flex-row items-center w-full rounded-md border bg-default overflow-hidden',
    base: 'flex-1 min-w-0 bg-transparent text-center text-highlighted placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75',
    increment: 'shrink-0 flex flex-row items-center justify-center text-toned active:bg-elevated ui-disabled:opacity-50',
    decrement: 'shrink-0 flex flex-row items-center justify-center text-toned active:bg-elevated ui-disabled:opacity-50',
    incrementIcon: 'shrink-0',
    decrementIcon: 'shrink-0',
  },
  variants: {
    size: {
      sm: {
        base: 'py-1.5 text-sm',
        increment: 'size-7',
        decrement: 'size-7',
        incrementIcon: 'size-4',
        decrementIcon: 'size-4',
      },
      md: {
        base: 'py-2 text-sm',
        increment: 'size-8',
        decrement: 'size-8',
        incrementIcon: 'size-5',
        decrementIcon: 'size-5',
      },
      lg: {
        base: 'py-2 text-base',
        increment: 'size-9',
        decrement: 'size-9',
        incrementIcon: 'size-5',
        decrementIcon: 'size-5',
      },
      xl: {
        base: 'py-2.5 text-lg',
        increment: 'size-10',
        decrement: 'size-10',
        incrementIcon: 'size-6',
        decrementIcon: 'size-6',
      },
    },
    // Surface only (bg/border) on `root`; typed-text color lives on `base`
    // (the <input>) — CSS inheritance is OFF in the Lynx build
    // (`enableCSSInheritance: false`), so a `text-*` on the root <view> never
    // reaches the input element.
    variant: {
      outline: { root: 'bg-default border border-default' },
      soft: { root: 'bg-muted disabled:bg-muted border-transparent' },
      subtle: { root: 'bg-elevated border border-default' },
      ghost: { root: 'bg-transparent disabled:bg-transparent border-transparent' },
      none: { root: 'bg-transparent border-transparent' },
    },
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
  },
  // Resting border is neutral (set on the variants above); no `highlight` prop
  // here, so nothing colored to swap in.
  compoundVariants: [],
  defaultVariants: {
    size: 'md' as const,
    variant: 'outline' as const,
    color: 'primary' as const,
  },
})
