// Ported from nuxt/ui v3.0.2 `src/theme/textarea.ts`. Upstream is a pure
// passthrough to the input theme, mirrored here with one tweak: `root` uses
// `items-start` so multi-line content sits at the top of the box.
//
// Lynx adaptation matches `./input.ts`: chrome lives on `root`, the `<textarea>`
// is transparent and `flex-1`, and leading / trailing wrappers are inline flex
// siblings rather than `absolute` overlays.

import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'flex flex-row items-start w-full min-w-0 max-w-full overflow-hidden rounded-md transition-colors',
    // Typed-text color sits on `base` (the <textarea>), not `root`: CSS
    // inheritance is OFF in the Lynx build. `border-0` resets the native
    // <textarea>'s user-agent border (a black inset on the web build); the
    // themed border lives on `root`.
    base: 'flex-1 min-w-0 min-h-0 max-w-full bg-transparent border-0 text-highlighted placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 align-top',
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
    // Surface only (bg/border) on `root`; typed-text color lives on `base`.
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
    // Resting border is neutral; the colored border is opt-in via `highlight`
    // (no focus state on Lynx).
    ...colors.map(c => ({
      color: c,
      highlight: true,
      class: { root: `border border-${c}-500` }
    })),
    // Icons default to neutral (dimmed), decoupled from `color`; override via
    // the `leading` / `trailing` slots.
    { loading: true, leading: true, class: { leadingIcon: 'animate-spin' } },
    { loading: true, leading: false, trailing: true, class: { trailingIcon: 'animate-spin' } }
  ],
  defaultVariants: {
    size: 'md' as const,
    variant: 'outline' as const,
    color: 'primary' as const
  }
})
