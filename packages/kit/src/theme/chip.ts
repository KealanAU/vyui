// Ported from nuxt/ui v4 `src/theme/chip.ts` and adapted for Vue-Lynx.
//
// Chip is a notification-dot indicator overlaying a child: `root` wraps the
// child (`relative`), `base` is the dot, absolutely positioned at one corner
// (`inset: false` nudges it half its size out via `translate-x/y`).
//
// Two size scales: a dot scale (no content, 4–12px pills) and a badge scale
// (`text` / `content` set — readable numeric badges with horizontal padding).
// The component passes `hasContent` so the right one is picked at runtime.
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'relative flex flex-row items-center justify-center shrink-0',
    // `tabular-nums` keeps single-digit content visually centered.
    base: 'rounded-full flex flex-row items-center justify-center font-medium whitespace-nowrap leading-none tabular-nums border-2 border-white',
    // Foreground color for the content <text>. CSS inheritance is OFF in the
    // Lynx build, so `text-white` on the `base` dot <view> never reaches the
    // content <text>; the per-size `text-*` sits here for the same reason.
    text: 'text-white',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
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
    ...colors.map(color => ({
      color,
      class: `bg-${color}-500`,
    })),

    { hasContent: false, size: 'xs' as const, class: 'h-[8px] min-w-[8px]' },
    { hasContent: false, size: 'sm' as const, class: 'h-[9px] min-w-[9px]' },
    { hasContent: false, size: 'md' as const, class: 'h-[10px] min-w-[10px]' },
    { hasContent: false, size: 'lg' as const, class: 'h-[11px] min-w-[11px]' },
    { hasContent: false, size: 'xl' as const, class: 'h-[12px] min-w-[12px]' },
    { hasContent: false, size: '2xl' as const, class: 'h-[14px] min-w-[14px]' },
    { hasContent: false, size: '3xl' as const, class: 'h-[16px] min-w-[16px]' },

    // badge scale (with content). `min-w` matches `h` so single digits render as
    // a circle, and the tiny horizontal padding widens the pill for two digits
    // without going oval at one. Font size lives on the `text` slot — Lynx won't
    // cascade `text-*` from the dot <view>.
    { hasContent: true, size: 'xs' as const, class: { base: 'h-[18px] min-w-[18px] px-1', text: 'text-[11px]' } },
    { hasContent: true, size: 'sm' as const, class: { base: 'h-5 min-w-5 px-1', text: 'text-xs' } },
    { hasContent: true, size: 'md' as const, class: { base: 'h-[22px] min-w-[22px] px-1.5', text: 'text-xs' } },
    { hasContent: true, size: 'lg' as const, class: { base: 'h-6 min-w-6 px-1.5', text: 'text-sm' } },
    { hasContent: true, size: 'xl' as const, class: { base: 'h-7 min-w-7 px-2', text: 'text-sm' } },
    { hasContent: true, size: '2xl' as const, class: { base: 'h-8 min-w-8 px-2', text: 'text-base' } },
    { hasContent: true, size: '3xl' as const, class: { base: 'h-9 min-w-9 px-2.5', text: 'text-lg' } },

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
})
