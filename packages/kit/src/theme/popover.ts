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
    content: 'flex flex-col max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-y-auto bg-default rounded-md border border-default shadow-lg shadow-black/10 pointer-events-auto',
    handle: 'self-center w-9 h-1 rounded-full bg-accented mt-1.5 mb-1',
    arrow: 'fill-default',
  },
}
