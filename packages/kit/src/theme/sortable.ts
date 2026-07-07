/**
 * Sortable theme — light-mode Vue-Lynx defaults for a drag-to-reorder list.
 *
 * Two-layer row: `item` is the transparent shell core transforms during a drag
 * (any paint on it would travel with the finger — that's how the old divider
 * look smeared); `itemContent` is the visible pill, so only the pill appears
 * to move. The shell's bottom padding is the row gap and lives INSIDE the
 * fixed row pitch (`itemHeight` on `SortableRoot`), keeping the main-thread
 * swap math aligned with the rendered geometry.
 *
 * Size variant drives the gap, pill padding, and the optional drag handle
 * size. The `itemHeight` prop is set in pixels by the wrapper from this same
 * size token.
 */
export default {
  slots: {
    root: 'w-full min-w-0 max-w-full overflow-hidden flex flex-col',
    item: 'group flex flex-col min-w-0 max-w-full',
    itemContent: 'flex-1 flex flex-row items-center min-w-0 overflow-hidden gap-2 bg-white border border-neutral-200 rounded-md group-ui-dragging:border-neutral-300',
    handle: 'shrink-0 text-neutral-400',
  },
  variants: {
    size: {
      sm: {
        item: 'pb-1.5',
        itemContent: 'px-4 text-base',
        handle: 'size-5',
      },
      md: {
        item: 'pb-2',
        itemContent: 'px-5 text-lg',
        handle: 'size-6',
      },
      lg: {
        item: 'pb-2',
        itemContent: 'px-6 text-xl',
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
