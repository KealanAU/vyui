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
 * Core `Sheet*` owns the side-aware slide, snap, and dismiss physics.
 * The `side` variant here handles edge placement and dimensions for the
 * styled drawer chrome.
 */
export default {
  slots: {
    overlay: 'fixed inset-0 bg-neutral-900/50',
    content: 'fixed z-[1001] bg-elevated border border-neutral-200 flex overflow-hidden max-h-[100vh]',
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
    // `flex-*` direction here mirrors core's per-side `flex-direction` so the
    // drag handle (SheetContent's first child) floats onto the sheet's inner
    // edge. It must live on `content` too: the base `flex` utility would
    // otherwise default to `row`, and a bare base `flex-col` would override
    // core's rule (equal specificity, Tailwind wins), pinning the handle top.
    side: {
      top: {
        content: 'inset-x-0 top-0 max-h-[100vh] flex-col-reverse',
      },
      right: {
        content: 'right-0 inset-y-0 w-full max-w-md flex-row',
      },
      bottom: {
        content: 'inset-x-0 bottom-0 max-h-[100vh] flex-col',
      },
      left: {
        content: 'left-0 inset-y-0 w-full max-w-md flex-row-reverse',
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
