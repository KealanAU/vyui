/**
 * ActionSheet theme — Linear-style bottom action menu. Built on the core
 * `Sheet*` primitives (bottom-anchored, drag-to-dismiss). Light-mode only;
 * `dark:*`, `focus:*`, `focus-visible:*`, `shadow-*` classes dropped.
 *
 * Items default to neutral text; per-color compound variants paint the label
 * + leading icon in the semantic color (e.g. `color: 'error'` for destructive
 * actions).
 */
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    overlay: 'fixed inset-0 bg-neutral-900/40 data-[state=open]:animate-[fade-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_200ms_ease-in]',
    content: 'flex flex-col',
    handle: 'self-center w-9 h-1 rounded-full bg-neutral-300 mt-2 mb-1',
    header: 'flex flex-col gap-0.5 px-4 pt-2 pb-3',
    title: 'text-neutral-500 text-xs font-semibold uppercase tracking-wider',
    description: 'text-neutral-700 text-sm',
    list: 'flex flex-col pb-2',
    item: 'flex flex-row items-center gap-3 px-4 py-3 transition-colors active:bg-neutral-100',
    itemLeadingIcon: 'shrink-0 text-neutral-700',
    itemLeadingAvatar: 'shrink-0',
    itemLabel: 'flex-1 text-neutral-900',
    itemTrailingIcon: 'shrink-0 text-neutral-400',
    separator: 'mx-4 my-1 h-px bg-neutral-200',
    cancel: 'mx-4 mb-4 mt-1 flex flex-row items-center justify-center px-4 py-3 rounded-xl bg-neutral-100 active:bg-neutral-200',
    cancelLabel: 'text-neutral-900 font-medium',
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
        itemLeadingIcon: `text-${color}-600`,
      },
    })),
  ],
  defaultVariants: {
    size: 'md' as const,
  },
})
