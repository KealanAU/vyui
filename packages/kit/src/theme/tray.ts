/**
 * Tray theme — a morphing, content-hugging bottom sheet with multi-view
 * navigation. Built on core's `Sheet*` primitives (`fitContent` mode) so the
 * panel takes its natural height; the `morph` slot animates that height
 * between views via CSS `transition: height` (device-proven on Lynx — see the
 * `feat/tray` height spike; MT `setStyleProperty` height is a no-op).
 *
 * Light-mode only, matching the shipping `Drawer` theme: `dark:*`, `focus*`,
 * and `shadow-*` classes are dropped (Lynx). Open/close slide + drag physics
 * are owned by core `SheetContentImpl`; this theme only styles chrome.
 *
 * `variant` is what distinguishes a Tray from a Drawer:
 *  - `floating` — a detached card that hovers with a gap on all sides, fully
 *    rounded and bordered (the Dynamic-Island / expo-dynamic-tray look).
 *  - `flush` — a classic bottom sheet glued to the screen edges, rounded top
 *    only (same silhouette as `Drawer`).
 *
 * The inset/positioning utilities here intentionally override core's
 * `.vyui-sheet__content--bottom` edge rules (`left/right/bottom: 0`,
 * `width: 100%`). Equal specificity (both single-class), so the later-injected
 * Tailwind utilities win — same cascade dance the Drawer theme relies on.
 */
export default {
  slots: {
    // Dim behind the panel (same as Drawer).
    overlay: 'fixed inset-0 bg-neutral-900/50',
    // The sheet panel. `fitContent` on core SheetContent means no explicit
    // height — it hugs handle + morph + footer. `variant` supplies the
    // edge/inset + border + radius chrome below.
    content: 'fixed z-[1001] flex flex-col overflow-hidden bg-white',
    // Drag pill (SheetContent's first child; core flex-direction pins it top).
    handle: 'self-center w-9 h-1 rounded-full bg-neutral-300 mt-1.5 mb-1',
    // Height-animated container. `overflow-hidden` clips the outgoing/incoming
    // view during the tween. `transition-[height]` + inline transitionDuration
    // (set from the `duration` prop) drive the morph.
    morph: 'overflow-hidden transition-[height] ease-out',
    // Inner natural-height wrapper — measured via @layoutchange; its height
    // becomes the morph target. Never gets an explicit height itself.
    viewport: 'flex flex-col',
    // Body padding around the active view.
    body: 'px-4 pt-2 pb-4',
    // Persistent footer — mounted outside `morph`, so it survives view swaps
    // (does not unmount/animate).
    footer: 'flex flex-col px-4 pt-2 pb-4 border-t border-neutral-100',
  },
  variants: {
    variant: {
      // Detached hovering card: gap on all sides, full border, all corners
      // rounded. `w-auto` unsets core's `width:100%` so the panel spans
      // between the left/right insets.
      floating: {
        content: 'left-4 right-4 bottom-4 w-auto rounded-2xl border border-neutral-200',
      },
      // Edge-anchored bottom sheet: flush left/right/bottom, top corners only.
      flush: {
        content: 'inset-x-0 bottom-0 rounded-t-2xl border-t border-neutral-200',
      },
    },
  },
  defaultVariants: {
    variant: 'floating' as const,
  },
}
