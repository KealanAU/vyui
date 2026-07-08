/**
 * Swiper theme — vyui original (no nuxt/ui counterpart). Wraps the
 * `SwiperRoot` + `SwiperItem` primitives from `@vyui/core` and adds a dot
 * indicator strip below the track.
 *
 * Semantic colors resolve via the consuming app's CSS variables — see
 * `apps/examples/kit-demo/src/index.css`.
 */
export default {
  slots: {
    root: 'relative w-full min-w-0 max-w-full overflow-hidden',
    item: 'w-full min-w-0 max-w-full overflow-hidden',
    indicators: 'absolute bottom-2 left-0 right-0 flex flex-row flex-wrap items-center justify-center max-w-full overflow-hidden',
    indicator: 'rounded-full bg-accented',
    indicatorActive: 'bg-primary-500',
  },
  variants: {
    direction: {
      horizontal: {
        indicators: 'flex-row bottom-2 left-0 right-0',
      },
      vertical: {
        indicators: 'flex-col top-0 bottom-0 right-2 items-center justify-center',
      },
    },
    size: {
      sm: {
        indicators: 'gap-1.5',
        indicator: 'size-2',
      },
      md: {
        indicators: 'gap-2',
        indicator: 'size-2.5',
      },
      lg: {
        indicators: 'gap-2.5',
        indicator: 'size-3',
      },
    },
  },
  defaultVariants: {
    direction: 'horizontal' as const,
    size: 'md' as const,
  },
}
