/**
 * Linear-inspired button styled to sit inside `<VyIsland>` — pill-shaped,
 * ghost-by-default, with an `active` state for the currently-selected tab.
 *
 * Sizing strategy (also see [[island.ts]]):
 *   sm → 40px tap target (compact toolbars, nested islands)
 *   md → 44px (default — Apple HIG min tap target)
 *   lg → 56px (Linear-mobile dock feel)
 *   xl → 64px (oversized hero dock)
 *
 * Icons and buttons grow together so the icon-to-button ratio stays around
 * 40–45% — enough presence without crowding the pill. NB: the actual rendered
 * size comes from the numeric `size` prop `IslandButton.vue` passes to
 * `<VyIcon>` (`ICON_PX`); the `size-*` classes here mirror those values but
 * are overridden by the icon's inline width/height, so keep the two in sync.
 *
 * Footprint sizing lives entirely in `compoundVariants` so the icon-only
 * and label-pill branches don't fight over `px-*`. Size flows in from the
 * parent `<VyIsland>` via context; pass an explicit `size` to override.
 */
// Foreground color (`text-slate-*`) sits on the `leadingIcon` / `label` slots,
// NOT the root `base` <view>: CSS inheritance is OFF in the Lynx build
// (`enableCSSInheritance: false`), so a `text-*` on the root never reaches the
// icon/label children. Surface (bg/opacity) stays on `base`. Same convention
// as `button.ts`.
export default {
  slots: {
    base:
      'flex flex-row items-center justify-center '
      + 'rounded-full font-medium '
      + 'active:bg-black/10 disabled:opacity-40',
    leadingIcon: 'shrink-0 text-slate-700',
    label: 'truncate text-slate-700',
  },
  variants: {
    size: {
      sm: { base: 'text-xs', leadingIcon: 'size-4' },
      md: { base: 'text-sm', leadingIcon: 'size-5' },
      lg: { base: 'text-base', leadingIcon: 'size-6' },
      xl: { base: 'text-lg', leadingIcon: 'size-7' },
    },
    active: {
      // `text-slate-900` on the text-bearing slots (won't cascade from `base`).
      true: { base: 'bg-black/10', leadingIcon: 'text-slate-900', label: 'text-slate-900' },
      false: {},
    },
    iconOnly: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // Label-pill footprint — horizontal padding + gap, fixed height.
    { size: 'sm', iconOnly: false, class: { base: 'gap-1 px-2.5 h-10' } },
    { size: 'md', iconOnly: false, class: { base: 'gap-1.5 px-3 h-11' } },
    { size: 'lg', iconOnly: false, class: { base: 'gap-2 px-4 h-14' } },
    { size: 'xl', iconOnly: false, class: { base: 'gap-2.5 px-5 h-16' } },
    // Icon-only square — explicit width/height, no padding so the icon
    // sits dead-centered with ~10–14px of breathing room.
    { size: 'sm', iconOnly: true, class: { base: 'w-10 h-10' } },
    { size: 'md', iconOnly: true, class: { base: 'w-11 h-11' } },
    { size: 'lg', iconOnly: true, class: { base: 'w-14 h-14' } },
    { size: 'xl', iconOnly: true, class: { base: 'w-16 h-16' } },
  ],
  defaultVariants: {
    size: 'md' as const,
    active: false as const,
    iconOnly: false as const,
  },
}
