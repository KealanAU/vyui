/**
 * Modal theme — adapted from nuxt/ui v3.0.2 `theme/modal.ts` for Vue-Lynx.
 *
 * Scope on mobile: short blocking alerts / confirms only — typically two
 * lines of text + one or two action buttons. For non-trivial overlays
 * (forms, pickers, content that should drag-to-dismiss, full-screen
 * presentations) use `VyDrawer` — it gives you snap points, drag physics,
 * and bottom-sheet ergonomics built on `SheetRoot`. The `fullscreen`
 * variant was removed deliberately: a full-screen Modal is just a Drawer
 * with `snapPoints: [1]`.
 *
 * Stripped: all `dark:*`, `focus:*`, `focus-visible:*`, `shadow-*`,
 * `transition-shadow`. `ring-*` converted to `border-*` (Lynx preset has no
 * ringWidth plugin).
 *
 * Motion: core is headless (ships no animation). `overlay` lands on the
 * Presence-wired backdrop via the Dialog's `backdropClass`; `content` lands on
 * the panel. Both elements carry the Presence lifecycle classes
 * (`ui-entering` / `ui-leaving` / `ui-open` / `ui-closed`), so the open/close
 * choreography is keyed off the `vy-modal-overlay` / `vy-modal-content` marker
 * classes in `style.css` — NOT `data-[state]`. Lifecycle classes are required
 * here: they keep the surface hidden during Presence's mount→enter gap (so the
 * dim doesn't flash full-opacity before fading in) and fire the exit animation
 * only on a real close.
 */
export default {
  slots: {
    overlay: 'fixed inset-0 bg-neutral-900/50',
    content: 'relative overflow-hidden bg-default divide-y divide-default flex flex-col w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100vh-1rem)] rounded-lg border border-default',
    header: 'flex flex-row items-center gap-1.5 px-4 py-3 min-h-12',
    wrapper: '',
    body: 'flex-1 min-h-0 overflow-y-auto p-4',
    footer: 'flex flex-row flex-wrap items-center gap-1.5 px-4 py-3',
    title: 'text-highlighted font-semibold',
    description: 'mt-1 text-muted text-sm',
    close: 'absolute top-3 end-4',
  },
  variants: {
    transition: {
      true: {
        overlay: 'vy-modal-overlay',
        content: 'vy-modal-content',
      },
    },
  },
  defaultVariants: {
    transition: true as const,
  },
}
