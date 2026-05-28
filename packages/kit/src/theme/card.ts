// Ported from nuxt/ui v3.0.2 `src/theme/card.ts` and adapted for Vue-Lynx.
//
// Light-mode-only port — `dark:` classes dropped. Variants: `solid` /
// `outline` / `soft` / `subtle`. Semantic color is not exposed (card uses
// neutral surfaces only); apps can override via `appConfig.ui.card`.

export default {
  slots: {
    root: 'rounded-lg',
    header: 'p-4',
    body: 'p-4',
    footer: 'p-4',
  },
  variants: {
    variant: {
      solid: {
        root: 'bg-neutral-900 text-white',
      },
      outline: {
        root: 'bg-white border border-neutral-200',
      },
      soft: {
        root: 'bg-neutral-50',
      },
      subtle: {
        root: 'bg-neutral-50 border border-neutral-200',
      },
    },
  },
  defaultVariants: {
    variant: 'outline' as const,
  },
}
