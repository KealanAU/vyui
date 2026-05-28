/**
 * Linear-inspired pill-island container.
 *
 * Sizing model (see also [[islandButton.ts]]):
 *   sm → 40px buttons, compact padding
 *   md → 44px buttons (default — Apple HIG min tap target)
 *   lg → 56px buttons (Linear mobile feel)
 *   xl → 64px buttons (oversized hero dock)
 *
 * **`expandStyle`** controls how the panel relates visually to the row:
 *   - `floating` (default) — row pill and panel are **independent** floating
 *     surfaces (each with its own background/blur/border/shadow), separated
 *     by a gap. Panel reads as a menu popping in front of the dock; the
 *     shadow falling between the two surfaces gives the stack obvious depth.
 *   - `attached` — when open, panel and row merge into ONE continuous
 *     rounded-rectangle surface (chrome moves to root, panel/row become
 *     transparent inner sections, gap goes to zero, children stretch
 *     edge-to-edge). Reads as the dock itself growing upward.
 *
 * Asymmetric `px > py` on the row keeps a SINGLE-button island a clear
 * horizontal pill (instead of collapsing to a circle that `rounded-full`
 * would otherwise paint on a square wrapper).
 *
 * `size` flows from the wrapper to child `<VyIslandButton>`s via context.
 * `position` covers fixed `top` / `bottom` placement + `inline` for
 * embedded use. Panel grows away from the anchored edge.
 */

const PILL_SURFACE
  = 'bg-white/80 backdrop-blur-xl '
    + 'border border-black/5 shadow-xl shadow-black/10'

export default {
  slots: {
    // Layout shim — owns positioning + the gap between row and panel.
    // No background of its own by default; gains chrome in `attached` mode
    // (see compoundVariants).
    root: 'flex flex-col',
    // Independently styled row pill. `floating` mode keeps the chrome here;
    // `attached + open` strips it (chrome shifts to root).
    row: `flex flex-row items-center ${PILL_SURFACE} rounded-full`,
    // Independently styled panel surface — a wider rounded-rectangle
    // floating in front of the row when `open === true`. Stripped of chrome
    // in `attached` mode.
    panel: `flex flex-col ${PILL_SURFACE} rounded-3xl`,
  },
  variants: {
    position: {
      top: { root: 'fixed top-4 left-1/2 -translate-x-1/2 z-50 items-center' },
      bottom: { root: 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 items-center' },
      inline: { root: 'items-center' },
    },
    size: {
      sm: {
        root: 'gap-2',
        row: 'gap-1 px-1.5 py-1',
        panel: 'gap-1 p-2',
      },
      md: {
        root: 'gap-2.5',
        row: 'gap-1.5 px-2 py-1.5',
        panel: 'gap-1.5 p-2.5',
      },
      lg: {
        root: 'gap-3',
        row: 'gap-2 px-2.5 py-2',
        panel: 'gap-2 p-3',
      },
      xl: {
        root: 'gap-3.5',
        row: 'gap-2.5 px-3 py-2.5',
        panel: 'gap-2.5 p-3.5',
      },
    },
    // `floating` keeps each surface chromed individually (theme default).
    // `attached` is a no-op by itself — the merge only fires when open
    // (handled via compoundVariants below). Keep both branches present so
    // tailwind-variants emits the data-attr toggle even when closed.
    expandStyle: {
      floating: {},
      attached: {},
    },
    // `open` is exposed as a variant (not just a `data-state`) so the
    // attached-surface compound variant can fire only when the panel is
    // actually visible — closed islands keep the rounded-full row pill
    // regardless of `expandStyle`.
    open: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // Attached + open: collapse the two surfaces into one. Chrome migrates
    // to root, row + panel become transparent, gap goes to 0, and children
    // stretch edge-to-edge so the visual width is uniform.
    {
      expandStyle: 'attached',
      open: true,
      class: {
        root: `gap-0 items-stretch ${PILL_SURFACE} rounded-3xl`,
        row: 'bg-transparent border-0 shadow-none backdrop-blur-none rounded-none',
        panel: 'bg-transparent border-0 shadow-none backdrop-blur-none rounded-none',
      },
    },
  ],
  defaultVariants: {
    position: 'bottom' as const,
    size: 'md' as const,
    expandStyle: 'floating' as const,
    open: false as const,
  },
}
