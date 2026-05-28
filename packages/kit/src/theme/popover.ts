/**
 * Popover theme — adapted from nuxt/ui v3.0.2 `theme/popover.ts` for Vue-Lynx.
 *
 * Stripped: all `dark:*`, `focus:*`, `focus-visible:*`, `transition-shadow`.
 * `ring-*` converted to `border-*` (Lynx preset has no ringWidth plugin).
 * Kept `data-[state=...]:*` animation classes. `shadow-lg shadow-black/10`
 * mirrors the elevation used on `IslandContainer` so floating surfaces
 * (popover, dropdown, island) share one elevation language.
 */
export default {
  slots: {
    content: 'bg-white rounded-md border border-neutral-200 shadow-lg shadow-black/10 data-[state=open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] pointer-events-auto',
    arrow: 'fill-neutral-200',
  },
}
