/**
 * Drawer theme — adapted from nuxt/ui v3.0.2 `theme/slideover.ts` for
 * Vue-Lynx. `Slideover` (side-sliding panel) is the closer match to our
 * core `Sheet*` primitive than `Drawer` (vaul snap-points). Light-mode
 * only; `dark:*`, `focus:*`, `focus-visible:*`, `shadow-*`, and
 * `transition-shadow` classes are dropped. Nuxt UI's animation utilities
 * are dropped too: open/close motion is owned by core's Presence-driven
 * `vyui-*` keyframes, and a same-specificity `ui-open:animate-[…]` utility
 * later in the cascade overrides them with undefined keyframes — the
 * drawer then snaps open with no slide.
 *
 * NOTE: the core `Sheet*` primitive is a bottom-sheet — the `side` prop
 * here drives a `data-side` attribute on the content for styling, but
 * physical drag direction remains bottom. Snap/dismiss physics live in
 * `SheetRoot`.
 */
export default {
  slots: {
    overlay: 'fixed inset-0 bg-neutral-900/50',
    content: 'fixed bg-white border border-neutral-200 flex flex-col overflow-hidden max-h-[100dvh]',
    handle: 'self-center w-9 h-1 rounded-full bg-neutral-300 mt-1.5 mb-1',
    scaffold: 'flex flex-col flex-1 min-h-0',
    header: 'flex flex-row items-center gap-1.5 px-4 py-3 min-h-12',
    wrapper: 'flex flex-col',
    body: 'flex-1 min-h-0 overflow-y-auto p-4',
    footer: 'flex flex-row flex-wrap items-center gap-1.5 px-4 py-3',
    title: 'text-neutral-900 font-semibold',
    description: 'mt-1 text-neutral-500 text-sm',
    close: 'absolute top-4 end-4',
  },
  variants: {
    side: {
      top: {
        content: 'inset-x-0 top-0 max-h-[100dvh]',
      },
      right: {
        content: 'right-0 inset-y-0 w-full max-w-md',
      },
      bottom: {
        content: 'inset-x-0 bottom-0 max-h-[100dvh]',
      },
      left: {
        content: 'left-0 inset-y-0 w-full max-w-md',
      },
    },
    transition: {
      // Intentionally empty — core's SheetContentImpl drives the slide via
      // `ui-entering`/`ui-leaving` keyframes. Kept so `transition` stays a
      // valid variant for user overrides via appConfig.
      true: {
        content: '',
      },
    },
  },
  defaultVariants: {
    side: 'bottom' as const,
    transition: true as const,
  },
}
