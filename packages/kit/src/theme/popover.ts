/**
 * Popover theme — adapted from nuxt/ui v3.0.2 `theme/popover.ts` for Vue-Lynx.
 *
 * Stripped: all `dark:*`, `focus:*`, `focus-visible:*`, `transition-shadow`,
 * and Nuxt UI's animation utilities (core owns open/close motion; the
 * referenced keyframes don't exist and the utility overrides core's).
 * `ring-*` converted to `border-*` (Lynx preset has no ringWidth plugin).
 * `shadow-lg shadow-black/10`
 * mirrors the elevation used on `IslandContainer` so floating surfaces
 * (popover, dropdown, island) share one elevation language.
 */
export default {
  slots: {
    content: 'bg-white rounded-md border border-neutral-200 shadow-lg shadow-black/10 pointer-events-auto',
    handle: 'self-center w-9 h-1 rounded-full bg-neutral-300 mt-2 mb-1',
    arrow: 'fill-neutral-200',
  },
}
