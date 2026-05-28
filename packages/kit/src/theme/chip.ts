// Ported from nuxt/ui v4 `src/theme/chip.ts` and adapted for Vue-Lynx.
//
// Chip is a notification-dot indicator that overlays a child element. The
// `root` slot wraps the child (`relative`) and the `base` slot is the dot
// itself, absolutely positioned at one of four corners.
//
// Two size scales live in this theme:
//   - dot scale  (used when the chip has no content)  — 4–12px pills
//   - badge scale (used when `text` / `content` slot is set) — readable
//     numeric badges with horizontal padding so digits don't overflow
//
// The component passes `hasContent` so the right scale is picked at runtime.
//
// Positioning:
//   - `base` is `absolute` (dropped when `standalone: true`)
//   - corner anchored via `top-0`/`right-0`/`bottom-0`/`left-0`
//   - when `inset: false` the dot is nudged half its size out of the box via
//     `translate-x`/`translate-y` (supported by `@lynx-js/tailwind-preset`)
//
// Light-mode-only port — semantic colors resolve to `bg-${c}-500`.

const COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

type SemanticColor = typeof COLORS[number]

export default {
  slots: {
    root: 'relative flex flex-row items-center justify-center shrink-0',
    // `tabular-nums` keeps single-digit content visually centered (Lynx
    // proportional fonts shift digit baselines just enough to look off in a
    // 16px circle).
    base: 'rounded-full flex flex-row items-center justify-center text-white font-medium whitespace-nowrap leading-none tabular-nums border-2 border-white',
  },
  variants: {
    color: Object.fromEntries(COLORS.map(c => [c, ''])) as Record<SemanticColor, ''>,
    size: {
      'xs': '',
      'sm': '',
      'md': '',
      'lg': '',
      'xl': '',
      '2xl': '',
      '3xl': '',
    },
    position: {
      'top-right': 'top-0 right-0',
      'bottom-right': 'bottom-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-left': 'bottom-0 left-0',
    },
    inset: {
      true: '',
      false: '',
    },
    standalone: {
      true: '',
      false: 'absolute',
    },
    /**
     * Switches the size scale: dot pills when false, numeric-badge pills
     * (taller + horizontal padding so digits fit) when true.
     */
    hasContent: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    // color -> solid background (flat per spec)
    ...COLORS.map(color => ({
      color,
      class: `bg-${color}-500`,
    })),

    // dot scale (no content) — original tiny notification dots
    { hasContent: false, size: 'xs' as const, class: 'h-[8px] min-w-[8px]' },
    { hasContent: false, size: 'sm' as const, class: 'h-[9px] min-w-[9px]' },
    { hasContent: false, size: 'md' as const, class: 'h-[10px] min-w-[10px]' },
    { hasContent: false, size: 'lg' as const, class: 'h-[11px] min-w-[11px]' },
    { hasContent: false, size: 'xl' as const, class: 'h-[12px] min-w-[12px]' },
    { hasContent: false, size: '2xl' as const, class: 'h-[14px] min-w-[14px]' },
    { hasContent: false, size: '3xl' as const, class: 'h-[16px] min-w-[16px]' },

    // badge scale (with content) — readable numeric pills.
    // `min-w` matches `h` so single digits render as a perfect circle.
    // Horizontal padding is intentionally tiny (px-0.5 / px-1) so two-digit
    // counts widen the pill slightly without the single-digit case going oval.
    { hasContent: true, size: 'xs' as const, class: 'h-[18px] min-w-[18px] px-1 text-[11px]' },
    { hasContent: true, size: 'sm' as const, class: 'h-5 min-w-5 px-1 text-xs' },
    { hasContent: true, size: 'md' as const, class: 'h-[22px] min-w-[22px] px-1.5 text-xs' },
    { hasContent: true, size: 'lg' as const, class: 'h-6 min-w-6 px-1.5 text-sm' },
    { hasContent: true, size: 'xl' as const, class: 'h-7 min-w-7 px-2 text-sm' },
    { hasContent: true, size: '2xl' as const, class: 'h-8 min-w-8 px-2 text-base' },
    { hasContent: true, size: '3xl' as const, class: 'h-9 min-w-9 px-2.5 text-lg' },

    // inset=false: nudge half the dot's size out of the parent at each corner
    { position: 'top-right' as const, inset: false, class: '-translate-y-1/2 translate-x-1/2 transform' },
    { position: 'bottom-right' as const, inset: false, class: 'translate-y-1/2 translate-x-1/2 transform' },
    { position: 'top-left' as const, inset: false, class: '-translate-y-1/2 -translate-x-1/2 transform' },
    { position: 'bottom-left' as const, inset: false, class: 'translate-y-1/2 -translate-x-1/2 transform' },
  ],
  defaultVariants: {
    color: 'primary' as const,
    size: 'md' as const,
    position: 'top-right' as const,
    hasContent: false as const,
  },
}
