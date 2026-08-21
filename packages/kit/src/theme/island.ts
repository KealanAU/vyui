/**
 * Linear-inspired pill-island container.
 *
 * Sizing (see also [[islandButton.ts]]): sm → 40px buttons, md → 44px (default,
 * Apple HIG min tap target), lg → 56px, xl → 64px.
 *
 * `expandStyle` controls how the panel relates to the row: `floating` (default)
 * keeps them as independent surfaces separated by a gap, `attached` merges them
 * into one continuous rounded rectangle when open.
 *
 * Asymmetric `px > py` gives multi-item rows a horizontal pill shape; a SOLO row
 * flips to symmetric + tight padding so an icon-only button reads as one clean
 * circle (see the `solo` variant + compoundVariants below).
 *
 * `size` flows to child `<VyIslandButton>`s via context. `position` picks the
 * viewport edge, `layer` controls stacking vs in-flow.
 */

const PILL_SURFACE
  = 'bg-white/80 backdrop-blur-xl '
    + 'border border-black/5 shadow-xl shadow-black/10'

export default {
  slots: {
    // Layout shim — owns positioning + the row/panel gap. Gains chrome in
    // `attached` mode (see compoundVariants).
    root: 'flex flex-col max-w-[calc(100vw-1rem)]',
    // Row pill. `floating` keeps the chrome here; `attached + open` strips it.
    row: `flex flex-row items-center max-w-full ${PILL_SURFACE} rounded-full`,
    // Panel surface, floating in front of the row when `open === true`.
    // Stripped of chrome in `attached` mode.
    panel: `flex flex-col max-w-full max-h-[calc(100vh-4rem)] overflow-y-auto ${PILL_SURFACE} rounded-3xl`,
  },
  variants: {
    // Which viewport edge to float against, when `layer !== 'inline'`. The fixed
    // placement is applied as an inline `style` in Island.vue (Lynx ignores
    // tailwind `fixed`); these variants only own cross-axis centering.
    position: {
      top: { root: 'items-center' },
      bottom: { root: 'items-center' },
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
    // `attached` is a no-op by itself — the merge fires only when open. Keep
    // both branches so tailwind-variants emits the toggle even when closed.
    expandStyle: {
      floating: {},
      attached: {},
    },
    // `open` is a variant (not just a `data-state`) so the attached-surface
    // compound fires only when the panel is visible.
    open: {
      true: {},
      false: {},
    },
    // `solo` fires when the row hosts a single child: symmetric padding plus a
    // zero gap, because vue-lynx renders empty `<text>` anchor nodes flanking
    // the slotted button and a non-zero `gap` spaces those too, warping the
    // would-be circle into a wide pill. Counted in `Island.vue`.
    solo: {
      true: { row: 'gap-0' },
      false: {},
    },
  },
  compoundVariants: [
    // Solo row: collapse the asymmetric px→py to a symmetric ring. Only `px` is
    // overridden; the size variant's `py` already sets the ring.
    { solo: true, size: 'sm', class: { row: 'px-1' } },
    { solo: true, size: 'md', class: { row: 'px-1.5' } },
    { solo: true, size: 'lg', class: { row: 'px-2' } },
    { solo: true, size: 'xl', class: { row: 'px-2.5' } },
    // Attached + open: chrome migrates to root, row + panel go transparent, gap
    // goes to 0, children stretch edge-to-edge.
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
    solo: false as const,
  },
}
