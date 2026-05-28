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
 * ringWidth plugin). Kept `data-[state=...]:*` animation classes.
 */
export default {
  slots: {
    overlay: 'fixed inset-0 bg-neutral-900/50',
    content: 'relative overflow-hidden bg-white divide-y divide-neutral-200 flex flex-col w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] rounded-lg border border-neutral-200',
    header: 'flex flex-row items-center gap-1.5 p-4 sm:px-6 min-h-16',
    wrapper: '',
    body: 'flex-1 overflow-y-auto p-4 sm:p-6',
    footer: 'flex flex-row items-center gap-1.5 p-4 sm:px-6',
    title: 'text-neutral-900 font-semibold',
    description: 'mt-1 text-neutral-500 text-sm',
    close: 'absolute top-4 end-4',
  },
  variants: {
    transition: {
      true: {
        overlay: 'data-[state=open]:animate-[fade-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_200ms_ease-in]',
        content: 'data-[state=open]:animate-[scale-in_200ms_ease-out] data-[state=closed]:animate-[scale-out_200ms_ease-in]',
      },
    },
  },
  defaultVariants: {
    transition: true as const,
  },
}
