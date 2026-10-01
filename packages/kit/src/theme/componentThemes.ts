import type { ResolveTheme } from '../composables/useStyledComponent'

type Themes = typeof import('./index')
type NonTheme = 'icons' | 'ALL_COLORS' | 'COLORS' | 'NEUTRAL' | 'resolveColors'

// Themes pin `defaultVariants` with `as const`, so a plain `Partial<theme>`
// would only accept the package default back; widen it to any declared value.
type ThemeOverride<T> = Partial<Omit<T, 'defaultVariants'>> & {
  defaultVariants?: T extends { variants: infer V } ? { [K in keyof V]?: keyof V[K] | boolean } : never
}

// Kit-only: the CLI registry ships a loose stub of this file, since a copied
// project holds only the theme files of the components it added.
export type ComponentThemes = {
  [K in Exclude<keyof Themes, NonTheme> as K extends 'switchTheme' ? 'switch' : K]?: ThemeOverride<ResolveTheme<Themes[K]>>
}
