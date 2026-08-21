// Ported from nuxt/ui v3.0.2 `src/theme/toast.ts` and adapted for Vue-Lynx:
// dark mode and `focus-visible:*` classes dropped, color tokens resolved via the
// consuming app's CSS variables, and the progress-bar slot rendered
// conditionally by the SFC.
import type { Color } from './colors'

// Same Lynx constraint as `button.ts`'s `iconFg`: the `<svg>` rasterizes its
// XML, so the `text-${c}-500` class on the `icon` slot never reaches the glyph —
// Toast.vue bakes the hex into the Icon `color` prop. The class below is built
// from this constant so the two can't drift.
export const ICON_FG_SHADE = 500

// LYNX NOTE — `var()` in inline `style=""` does NOT resolve on Lynx native
// (only stylesheet-level `var()` does), so toast swipe transforms would need
// concrete inline pixel values. Dropped here rather than implying they work; see
// `core/src/components/Slider/SliderThumbImpl.vue` for the canonical write-up.
export default (colors: Color[]) => ({
  slots: {
    root: 'relative group overflow-hidden bg-default rounded-lg border border-default shadow-lg shadow-black/10 p-4 flex flex-row min-w-0 gap-2.5 w-[calc(100vw-2rem)] max-w-sm',
    wrapper: 'w-0 min-w-0 flex-1 flex flex-col',
    title: 'text-sm font-medium text-highlighted',
    description: 'text-sm text-muted',
    icon: 'shrink-0 size-5',
    avatar: 'shrink-0',
    avatarSize: '2xl' as const,
    actions: 'flex flex-row flex-wrap max-w-full gap-1.5 shrink-0',
    progress: 'absolute inset-x-0 bottom-0 h-1 z-10',
    close: 'shrink-0'
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, {
      icon: `text-${c}-${ICON_FG_SHADE}`,
      progress: `bg-${c}-500`
    }])) as Record<Color, { icon: string, progress: string }>,
    orientation: {
      horizontal: {
        actions: 'items-center'
      },
      vertical: {
        actions: 'items-start mt-2.5'
      }
    },
    title: {
      true: {
        description: 'mt-1'
      }
    }
  },
  defaultVariants: {
    color: 'primary' as const,
    orientation: 'vertical' as const
  }
})
