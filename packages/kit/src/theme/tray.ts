/**
 * Tray theme — a morphing, content-hugging bottom sheet with multi-view
 * navigation. Built on core's `Sheet*` primitives (`fitContent`), so the panel
 * takes its natural height and the `morph` slot animates that height between
 * views via CSS `transition: height` (device-proven on Lynx; MT
 * `setStyleProperty` height is a no-op).
 *
 * `variant` is what distinguishes a Tray from a Drawer: `floating` is a
 * detached card hovering with a gap on all sides, `flush` a classic bottom
 * sheet glued to the screen edges. Its inset/positioning utilities
 * intentionally override core's `.vyui-sheet__content--bottom` edge rules —
 * equal specificity, so the later-injected Tailwind utilities win.
 */
export default {
  slots: {
    // Dim: `bg-black/50`, NOT an alpha on a semantic color. The preset wires
    // semantic colors to raw `var()` without `<alpha-value>`, so Tailwind skips
    // `bg-neutral-900/50` entirely (docs/styling-audit.md §4.1).
    overlay: 'fixed inset-0 bg-black/50',
    // The sheet panel — no explicit height under `fitContent`; it hugs handle +
    // morph + footer. `variant` supplies the edge/inset + border + radius.
    content: 'fixed z-[1001] flex flex-col overflow-hidden bg-default',
    handle: 'self-center w-9 h-1 rounded-full bg-accented mt-1.5 mb-1',
    // Height-animated container. `overflow-hidden` clips the outgoing view;
    // `transition-[height]` + inline transitionDuration drive the morph.
    morph: 'overflow-hidden transition-[height] ease-out',
    // Inner natural-height wrapper — measured via @layoutchange; never gets an
    // explicit height itself.
    viewport: 'flex flex-col',
    body: 'px-4 pt-2 pb-4',
    // The keyboard-aware `<scroll-view>` around the body slot. Scrolling only
    // engages once its height is bounded — apps must cap it here.
    bodyScroll: '',
    // Persistent footer — outside `morph`, so it survives view swaps.
    footer: 'flex flex-col px-4 pt-2 pb-4 border-t border-muted',
  },
  variants: {
    variant: {
      // Detached hovering card. `w-auto` unsets core's `width:100%` so the
      // panel spans between the left/right insets.
      floating: {
        content: 'left-4 right-4 bottom-4 w-auto rounded-2xl border border-default',
      },
      flush: {
        content: 'inset-x-0 bottom-0 rounded-t-2xl border-t border-default',
      },
    },
  },
  defaultVariants: {
    variant: 'floating' as const,
  },
}
