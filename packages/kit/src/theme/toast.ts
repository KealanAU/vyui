// Ported from nuxt/ui v3.0.2 `src/theme/toast.ts`. Adapted for Vue-Lynx:
// - Dropped dark mode + `focus-visible:*` classes (Lynx doesn't surface
//   focus rings the way the DOM does).
// - Color tokens use semantic palettes (`primary`, `error`, …) resolved via
//   CSS variables in the consuming app — see `colors.ts`.
// - Progress bar slot kept but rendered conditionally by the SFC; Lynx handles
//   the `data-[state=...]` animation hooks emitted by core's `ToastRoot`.

const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

type SemanticColor = typeof COLORS[number]

// LYNX NOTE — `var()` in inline `style=""` does NOT resolve on Lynx native
// (only stylesheet-level `var()` does). The original Reka UI swipe classes
// `translate-x-(--reka-toast-swipe-move-x)` / `translate-x-(--reka-toast-swipe-end-x)`
// expected the consumer to set those vars via inline style — that path is
// inert on Lynx, and we don't ship swipe-to-dismiss yet. Dropped to avoid
// implying it works. See `core/src/components/Slider/SliderThumbImpl.vue`
// (~L46) for the canonical write-up; resolve transforms inline as concrete
// pixel values instead of via custom-property indirection.
export default {
  slots: {
    root: 'relative group overflow-hidden bg-white rounded-lg border border-neutral-200 p-4 flex flex-row gap-2.5 data-[state=open]:animate-[slide-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_100ms_ease-in]',
    wrapper: 'w-0 flex-1 flex flex-col',
    title: 'text-sm font-medium text-neutral-900',
    description: 'text-sm text-neutral-500',
    icon: 'shrink-0 size-5',
    avatar: 'shrink-0',
    avatarSize: '2xl' as const,
    actions: 'flex flex-row gap-1.5 shrink-0',
    progress: 'absolute inset-x-0 bottom-0 h-1 z-10',
    close: 'shrink-0'
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, {
      icon: `text-${c}-500`,
      progress: `bg-${c}-500`
    }])) as Record<SemanticColor, { icon: string, progress: string }>,
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
}
