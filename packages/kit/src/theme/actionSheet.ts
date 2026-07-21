/**
 * ActionSheet theme — Linear-style bottom action menu. Built on the core
 * `Sheet*` primitives (bottom-anchored, drag-to-dismiss). Dark rides the semantic tokens;
 * `dark:*`, `focus:*`, `focus-visible:*`, `shadow-*` classes dropped.
 *
 * Items default to neutral text; per-color compound variants paint the label
 * + leading icon in the semantic color (e.g. `color: 'error'` for destructive
 * actions).
 */
import type { Color } from './colors'

// Same Lynx constraint as `button.ts`'s `iconFg`: the `<svg>` rasterizes its
// XML, so the `text-*` classes on the icon slots never reach the glyph —
// ActionSheet.vue bakes the fill via the Icon `color` prop (resolved with
// `resolveColorHex`). The classes below are built from these descriptors so
// class and baked color can't drift.
export function leadingIconFg(color?: string): { semantic: string, shade: number } {
  return color ? { semantic: color, shade: 600 } : { semantic: 'neutral', shade: 700 }
}

export const TRAILING_ICON_FG = { semantic: 'neutral', shade: 400 } as const

const fgClass = (fg: { semantic: string, shade: number }) => `text-${fg.semantic}-${fg.shade}`

export default (colors: Color[]) => ({
  slots: {
    // Dim: `bg-black/50`, NOT an alpha on a semantic color. The preset wires
    // semantic colors to raw `var()` without `<alpha-value>`, so Tailwind skips
    // generating `bg-neutral-900/50` entirely — this slot painted nothing for
    // as long as it read that way (docs/styling-audit.md §4.1). `black` parses
    // to rgb, so the modifier applies, and a scrim needs no mode awareness.
    overlay: 'fixed inset-0 bg-black/50',
    // `bg-default` is required, not decorative: core's Sheet ships no color
    // (headless), so without it the panel is transparent. It used to inherit
    // core's hardcoded `#fff`, which is exactly the bug — that white ignored
    // dark mode. Every other Sheet-backed theme already sets this.
    content: 'z-[1001] flex flex-col max-h-[100vh] overflow-hidden bg-default',
    handle: 'self-center w-9 h-1 rounded-full bg-accented mt-1.5 mb-1',
    header: 'flex flex-col gap-0.5 px-4 py-2',
    title: 'text-muted text-xs font-semibold uppercase tracking-wider',
    description: 'text-default text-sm',
    list: 'flex-1 flex flex-col min-h-0 overflow-y-auto pb-1',
    item: 'flex flex-row items-center gap-3 px-4 py-2.5 transition-colors active:bg-elevated',
    itemLeadingIcon: `shrink-0 ${fgClass(leadingIconFg())}`,
    itemLeadingAvatar: 'shrink-0',
    itemLabel: 'flex-1 text-highlighted',
    itemTrailingIcon: `shrink-0 ${fgClass(TRAILING_ICON_FG)}`,
    separator: 'mx-4 my-1 h-px bg-accented',
    cancel: 'mx-4 mb-2 mt-1 flex flex-row items-center justify-center px-4 py-2.5 rounded-xl bg-elevated active:bg-accented',
    cancelLabel: 'text-highlighted font-medium',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    size: {
      sm: {
        item: 'py-3 text-base',
        itemLeadingIcon: 'size-5',
        itemTrailingIcon: 'size-5',
        itemLabel: 'text-base',
      },
      md: {
        item: 'py-4 text-lg',
        itemLeadingIcon: 'size-6',
        itemTrailingIcon: 'size-6',
        itemLabel: 'text-lg',
      },
      lg: {
        item: 'py-5 text-xl',
        itemLeadingIcon: 'size-7',
        itemTrailingIcon: 'size-7',
        itemLabel: 'text-xl',
      },
    },
    disabled: {
      true: {
        item: 'opacity-50 cursor-not-allowed active:bg-transparent',
      },
    },
  },
  compoundVariants: [
    // Per-color row tints — label + leading icon adopt the semantic color,
    // and the active-press state uses the matching 50-tint background.
    ...colors.map(color => ({
      color,
      class: {
        item: `active:bg-${color}-50`,
        itemLabel: `text-${color}-600`,
        itemLeadingIcon: fgClass(leadingIconFg(color)),
      },
    })),
  ],
  defaultVariants: {
    size: 'md' as const,
  },
})
