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
    root: 'flex flex-row items-center w-full rounded-md border bg-white overflow-hidden',
    base: 'flex-1 min-w-0 bg-transparent text-center text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75',
    increment: 'shrink-0 flex flex-row items-center justify-center text-neutral-600 active:bg-neutral-100 data-[disabled]:opacity-50',
    decrement: 'shrink-0 flex flex-row items-center justify-center text-neutral-600 active:bg-neutral-100 data-[disabled]:opacity-50',
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
    variant: {
      outline: { root: 'text-neutral-900 bg-white border' },
      soft: { root: 'text-neutral-900 bg-neutral-100/50 disabled:bg-neutral-100/50 border-transparent' },
      subtle: { root: 'text-neutral-900 bg-neutral-100 border' },
      ghost: { root: 'text-neutral-900 bg-transparent disabled:bg-transparent border-transparent' },
      none: { root: 'text-neutral-900 bg-transparent border-transparent' },
    },
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
  },
  compoundVariants: [
    // Border colors live on `root` for the bordered variants.
    ...colors.flatMap(color => [
      { color, variant: 'outline' as const, class: { root: `border-${color}-500` } },
      { color, variant: 'subtle' as const, class: { root: `border-${color}-500` } },
    ]),
  ],
  defaultVariants: {
    size: 'md' as const,
    variant: 'outline' as const,
    color: 'primary' as const,
  },
})
