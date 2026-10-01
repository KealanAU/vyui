import type { Component, InjectionKey } from 'vue'
import type { ComponentThemes } from '@/lib/vyui/theme/componentThemes'

export type { ComponentThemes }

/** Recursive `Partial<T>` — every nested property is also optional. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export interface AppConfig {
  ui: {
    /** Semantic primary color name (maps to a tailwind palette via CSS vars). */
    primary?: string
    /** Semantic gray/neutral color name. */
    gray?: string
    /** List of semantic color names exposed to component `color` variants. */
    colors?: string[]
    /** Semantic icon name → Iconify id (e.g. `loading` → `i-lucide-loader-circle`). */
    icons?: Record<string, string>
  // The open index keeps custom semantic colors (`ui.tertiary = 'violet'`,
  // read by `resolveColorHex`) assignable alongside the typed component keys.
  } & ComponentThemes & Record<string, unknown>
}

export const APP_CONFIG_KEY: InjectionKey<AppConfig> = Symbol('vyui:app-config')

export interface VyUIPluginOptions {
  /** Override the default `ui` config — deep-merged over the package defaults. */
  ui?: DeepPartial<AppConfig['ui']>
  /** Register only this subset of components globally (keyed by tag name).
   *  Defaults to the full `REGISTRY`; an explicit set lets the bundler
   *  tree-shake the rest. */
  components?: Record<string, Component>
}
