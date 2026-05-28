/**
 * Layout container for placing multiple `<VyIsland>`s adjacent — e.g. a
 * main bottom dock + a trailing close pill, or two top islands side-by-side.
 *
 * Owns the fixed positioning (top/bottom of viewport) so each member
 * island can use `position="inline"` and stay focused on its own contents.
 *
 * `direction` toggles row vs column stacking. `align` controls which way
 * the group is pinned horizontally (or vertically, in column mode).
 */
export default {
  slots: {
    root: 'flex items-end',
  },
  variants: {
    position: {
      top: 'fixed top-4 inset-x-0 z-50 items-start',
      bottom: 'fixed bottom-4 inset-x-0 z-50',
      inline: '',
    },
    direction: {
      row: 'flex-row',
      col: 'flex-col',
    },
    align: {
      start: 'justify-start px-4',
      center: 'justify-center',
      end: 'justify-end px-4',
      between: 'justify-between px-4',
    },
    size: {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  defaultVariants: {
    position: 'inline' as const,
    direction: 'row' as const,
    align: 'center' as const,
    size: 'md' as const,
  },
}
