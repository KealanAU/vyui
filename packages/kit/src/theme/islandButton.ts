/**
 * Linear-inspired button styled to sit inside `<VyIsland>` — pill-shaped,
 * ghost-by-default, with an `active` state for the selected tab.
 *
 * Sizing (also see [[island.ts]]): sm → 40px, md → 44px (default, Apple HIG min
 * tap target), lg → 56px, xl → 64px. Icons grow with the button to hold a
 * ~40–45% ratio; the rendered icon size comes from the numeric `size` prop
 * `IslandButton.vue` passes to `<VyIcon>` (`ICON_PX`) — the `size-*` classes
 * here mirror those values but are overridden by the icon's inline
 * width/height, so keep the two in sync.
 *
 * Footprint sizing lives entirely in `compoundVariants` so the icon-only and
 * label-pill branches don't fight over `px-*`.
 *
 * `enableCSSInheritance: false` — fg lands on `leadingIcon` / `label`; surface stays on `base`.
 */
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
    { size: 'sm', iconOnly: false, class: { base: 'gap-1 px-2.5 h-10' } },
    { size: 'md', iconOnly: false, class: { base: 'gap-1.5 px-3 h-11' } },
    { size: 'lg', iconOnly: false, class: { base: 'gap-2 px-4 h-14' } },
    { size: 'xl', iconOnly: false, class: { base: 'gap-2.5 px-5 h-16' } },
    // Icon-only square — explicit width/height, no padding, so the icon sits
    // dead-centered.
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
