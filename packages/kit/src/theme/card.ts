// Ported from nuxt/ui v3.0.2 `src/theme/card.ts` — see `./button.ts` for the
// shared Lynx adaptations. Semantic color is not exposed: card uses neutral
// surfaces only, overridable via `appConfig.ui.card`.

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
        // `enableCSSInheritance: false` — fg lands on header/body/footer and no further; plain-text
        // children of a solid card set their own color.
        root: 'bg-inverted',
        header: 'text-inverted',
        body: 'text-inverted',
        footer: 'text-inverted',
      },
      outline: {
        root: 'bg-default border border-default',
      },
      soft: {
        root: 'bg-muted',
      },
      subtle: {
        root: 'bg-muted border border-default',
      },
    },
  },
  defaultVariants: {
    variant: 'outline' as const,
  },
}
