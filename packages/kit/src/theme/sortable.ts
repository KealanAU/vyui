/**
 * Sortable theme — light-mode Vue-Lynx defaults for a drag-to-reorder list.
 *
 * Size variant drives item padding plus the optional drag handle size. The
 * `itemHeight` prop on `SortableRoot` is set in pixels by the wrapper based on
 * this same size token so the swap math stays aligned with the visual row.
 */
export default {
  slots: {
    root: 'w-full min-w-0 max-w-full overflow-hidden flex flex-col',
    item: 'flex flex-row items-center min-w-0 max-w-full overflow-hidden gap-2 bg-white border-b border-neutral-200 last:border-b-0',
    handle: 'shrink-0 text-neutral-400',
  },
  variants: {
    size: {
      sm: {
        item: 'px-4 py-3 text-base',
        handle: 'size-5',
      },
      md: {
        item: 'px-5 py-4 text-lg',
        handle: 'size-6',
      },
      lg: {
        item: 'px-6 py-5 text-xl',
        handle: 'size-7',
      },
    },
    disabled: {
      true: { item: 'opacity-50 cursor-not-allowed' },
    },
  },
  defaultVariants: {
    size: 'md' as const,
  },
}
