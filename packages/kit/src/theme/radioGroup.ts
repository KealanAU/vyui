/**
 * RadioGroup theme — adapted from nuxt/ui v3.0.2 `theme/radio-group.ts` for
 * Vue-Lynx. Semantic color names resolve via the consuming app's CSS variables
 * (see `apps/examples/kit-demo/src/index.css`). Dark-mode / focus-visible /
 * shadow utilities are dropped (light-only, no DOM focus rings in Lynx).
 *
 * Per-color × per-checked compound variants paint the indicator (filled dot)
 * directly with semantic Tailwind classes (`bg-primary-500`).
 */
import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'relative min-w-0 max-w-full',
    // `fieldset` direction is set per orientation variant (flex-row/flex-col).
    fieldset: 'flex min-w-0 max-w-full',
    legend: 'mb-1 block font-medium text-highlighted',
    // `gap-2` spaces the control from the label — Lynx ignores logical inline
    // margins (`ms-*`), so the old `ms-2` collapsed them. Matches Checkbox.
    item: 'flex flex-row items-start min-w-0 gap-2',
    base: 'shrink-0 flex flex-row items-center justify-center rounded-full bg-default border border-accented transition-colors',
    indicator: 'flex flex-row items-center justify-center rounded-full bg-white',
    container: 'flex flex-row items-center',
    wrapper: 'flex flex-col min-w-0',
    label: 'block font-medium text-highlighted',
    description: 'text-muted',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    orientation: {
      horizontal: {
        fieldset: 'flex-row flex-wrap',
        wrapper: 'me-2',
      },
      vertical: {
        fieldset: 'flex-col',
      },
    },
    size: {
      sm: {
        fieldset: 'gap-1',
        legend: 'text-sm',
        base: 'w-4 h-4',
        item: 'text-sm',
        container: 'h-5',
        indicator: 'w-2 h-2',
        label: 'text-sm',
        description: 'text-xs',
      },
      md: {
        fieldset: 'gap-1',
        legend: 'text-sm',
        base: 'w-[1.125rem] h-[1.125rem]',
        item: 'text-sm',
        container: 'h-5',
        indicator: 'w-2 h-2',
        label: 'text-sm',
        description: 'text-xs',
      },
      lg: {
        fieldset: 'gap-1.5',
        legend: 'text-base',
        base: 'w-5 h-5',
        item: 'text-base',
        container: 'h-6',
        indicator: 'w-2.5 h-2.5',
        label: 'text-base',
        description: 'text-sm',
      },
      xl: {
        fieldset: 'gap-2',
        legend: 'text-lg',
        base: 'w-6 h-6',
        item: 'text-lg',
        container: 'h-7',
        indicator: 'w-3 h-3',
        label: 'text-lg',
        description: 'text-base',
      },
    },
    checked: {
      true: '',
      false: '',
    },
    disabled: {
      true: {
        base: 'opacity-50 cursor-not-allowed',
        label: 'opacity-50 cursor-not-allowed',
      },
    },
    required: {
      true: {
        legend: "after:content-['*'] after:ms-0.5 after:text-error-500",
      },
    },
  },
  compoundVariants: [
    // checked → outer ring becomes primary border, base fills primary, inner
    // dot stays white so the macOS-style 3-layer look (outline / fill / dot)
    // reads correctly. `border-2` thickens the outline so it remains visible
    // alongside the colored fill.
    ...colors.map(color => ({
      color,
      checked: true as const,
      class: {
        base: `bg-${color}-500 border-2 border-${color}-500`,
      },
    })),
  ],
  defaultVariants: {
    color: 'primary' as const,
    size: 'md' as const,
    orientation: 'vertical' as const,
  },
})
