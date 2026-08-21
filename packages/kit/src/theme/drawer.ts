/**
 * Drawer theme — adapted from nuxt/ui v3.0.2 `theme/slideover.ts` for Vue-Lynx
 * (`Slideover` is the closer match to core's `Sheet*` than vaul-style `Drawer`).
 * Dark rides the semantic tokens; `dark:*`, `focus*`, `shadow-*` are dropped, as
 * are nuxt's animation utilities — open/close motion is owned by core's
 * Presence-driven `vyui-*` keyframes, and a same-specificity
 * `ui-open:animate-[…]` utility later in the cascade would override them with
 * undefined keyframes and the drawer would snap open with no slide.
 *
 * The `side` variant here handles edge placement and dimensions only.
 */
export default {
  slots: {
    // Dim: `bg-black/50`, NOT an alpha on a semantic color. The preset wires
    // semantic colors to raw `var()` without `<alpha-value>`, so Tailwind skips
    // `bg-neutral-900/50` entirely (docs/styling-audit.md §4.1).
    overlay: 'fixed inset-0 bg-black/50',
    content: 'fixed z-[1001] bg-default border border-default flex overflow-hidden max-h-[100vh]',
    handle: 'self-center w-9 h-1 rounded-full bg-accented mt-1.5 mb-1',
    scaffold: 'flex flex-col flex-1 min-h-0',
    header: 'flex flex-row items-center gap-1.5 px-4 py-3 min-h-12',
    wrapper: 'flex flex-col',
    body: 'flex-1 min-h-0 overflow-y-auto p-4',
    footer: 'w-full flex flex-row flex-wrap items-center gap-1.5 px-4 py-3',
    title: 'text-highlighted font-semibold',
    description: 'mt-1 text-muted text-sm',
    close: 'absolute top-4 end-4',
  },
  variants: {
    // `flex-*` here mirrors core's per-side `flex-direction` so the drag handle
    // floats onto the sheet's inner edge. It must live on `content` too: a bare
    // base `flex-col` would override core's rule at equal specificity.
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
      // Intentionally empty — core's SheetContentImpl drives the slide. Kept so
      // `transition` stays a valid variant for appConfig overrides.
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
