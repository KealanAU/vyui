import type { Component, InjectionKey } from 'vue'

/** Recursive `Partial<T>` — every nested property is also optional. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/**
 * Per-component theme override bucket, keyed by component name. Each entry is a
 * partial of that component's resolved `tailwind-variants` config, typed loosely
 * here because component themes register lazily — strong typing happens at each
 * component boundary via `Partial<typeof theme>`.
 */
export type ComponentThemes = Record<string, unknown>

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
  } & ComponentThemes
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
