/**
 * SwipeAction theme — vyui original (no nuxt/ui parallel). Light-mode-only.
 *
 * NOTE: the core `SwipeAction` primitive only supports a trailing (right-side)
 * action panel today — the `side` variant here drives styling/`data-side`
 * only; it does not flip the physical drag direction.
 */
export default {
  slots: {
    root: 'relative overflow-hidden',
    actions: 'flex flex-row items-stretch bg-neutral-100',
    content: 'flex flex-row items-center bg-white',
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
