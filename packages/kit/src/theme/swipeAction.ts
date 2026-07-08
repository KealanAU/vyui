/**
 * SwipeAction theme — vyui original (no nuxt/ui parallel). Light-mode-only.
 *
 * NOTE: the core `SwipeAction` primitive only supports a trailing (right-side)
 * action panel today — the `side` variant here drives styling/`data-side`
 * only; it does not flip the physical drag direction.
 */
export default {
  slots: {
    root: 'relative min-w-0 max-w-full overflow-hidden',
    actions: 'flex flex-row items-stretch min-w-0 max-w-full overflow-hidden bg-neutral-100',
    content: 'flex flex-row items-center min-w-0 max-w-full overflow-hidden bg-default',
  },
  variants: {
    side: {
      left: {
        actions: 'justify-start',
      },
      right: {
        actions: 'justify-end',
      },
    },
  },
  defaultVariants: {
    side: 'right' as const,
  },
}
