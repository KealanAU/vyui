// Ported from nuxt/ui v3.0.2 `src/theme/card.ts` and adapted for Vue-Lynx.
//
// Light-mode-only port — `dark:` classes dropped. Variants: `solid` /
// `outline` / `soft` / `subtle`. Semantic color is not exposed (card uses
// neutral surfaces only); apps can override via `appConfig.ui.card`.

export default {
  slots: {
    root: 'min-w-0 max-w-full overflow-hidden rounded-lg',
    header: 'min-w-0 p-4',
    body: 'min-w-0 p-4',
    footer: 'min-w-0 p-4',
  },
  variants: {
    variant: {
      solid: {
        // `enableCSSInheritance: false`: a `text-*` on the `root` <view> never
        // reaches slot content. Card owns no text element (header/body/footer
        // are containers for user-supplied content), so the foreground rides on
        // those content slots. Lynx still won't cascade into deeply-nested
        // <text>, so plain-text children of a solid card should set their own
        // color (or pass `ui.{header,body,footer}`); the `bg-*` fill stays on
        // `root`.
        root: 'bg-inverted',
        header: 'text-inverted',
        body: 'text-inverted',
        footer: 'text-inverted',
      },
      outline: {
        root: 'bg-default border border-neutral-200',
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
