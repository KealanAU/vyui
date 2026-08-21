/**
 * Modal theme — adapted from nuxt/ui v3.0.2 `theme/modal.ts` for Vue-Lynx.
 *
 * Scope on mobile: short blocking alerts / confirms only. For anything larger
 * (forms, pickers, drag-to-dismiss, full-screen) use `VyDrawer` — a full-screen
 * Modal is just a Drawer with `snapPoints: [1]`, which is why the `fullscreen`
 * variant was dropped.
 *
 * Stripped: `dark:*`, `focus*`, `shadow-*`; `ring-*` converted to `border-*`
 * (the Lynx preset has no ringWidth plugin).
 *
 * Motion: core is headless. `overlay` lands on the Presence-wired backdrop via
 * the Dialog's `backdropClass`, `content` on the panel; both carry the Presence
 * lifecycle classes, so the choreography is keyed off the `vy-modal-*` marker
 * classes in `style.css`, NOT `data-[state]`. The lifecycle classes keep the
 * surface hidden through Presence's mount→enter gap and fire the exit animation
 * only on a real close.
 */
export default {
  slots: {
    // Dim: `bg-black/50`, NOT an alpha on a semantic color. The preset wires
    // semantic colors to raw `var()` without `<alpha-value>`, so Tailwind skips
    // `bg-neutral-900/50` entirely (docs/styling-audit.md §4.1).
    overlay: 'fixed inset-0 bg-black/50',
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
