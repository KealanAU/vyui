import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import { tv, type ClassValue, type TVReturnType, type VariantProps } from 'tailwind-variants'
import { resolveColors } from '../theme/colors'
import { useAppConfig } from './useAppConfig'

/** The factory returned by calling `tv(theme)`. */
export type TVFactory = ReturnType<typeof tv>

/** Unwraps a builder theme (`(colors) => themeObject`) to its config object. */
export type ResolveTheme<T> = T extends (...args: never[]) => infer R ? R : T

/**
 * Build a per-app-config `tv` factory for a styled component: merges the package
 * default theme with any user override at `appConfig.ui[name]` and returns the
 * invoked slot map (under `ui`).
 *
 * @param name      Key under `appConfig.ui` where user overrides live.
 * @param theme     The package default theme — a builder function (invoked with
 *                  the resolved color list) or a plain `tv` config object.
 * @param variants  Variant props; ref, getter, or plain object.
 */
export function useStyledComponent<TTheme>(
  name: string,
  theme: TTheme,
  variants: MaybeRefOrGetter<Record<string, unknown>>,
): {
  ui: ComputedRef<ReturnType<ThemeTV<TTheme>>>
} {
  const appConfig = useAppConfig()
  const tvFactory = computed(() => {
    // Factories are memoized on (appConfig, name): the config is stable per app
    // and not reactive, so per-instance rebuilds cost real time on PrimJS.
    let perApp = factoryCache.get(appConfig)
    if (!perApp) {
      perApp = new Map()
      factoryCache.set(appConfig, perApp)
    }
    const cached = perApp.get(name)
    if (cached)
      return cached

    const base = typeof theme === 'function'
      ? (theme as (colors: string[]) => unknown)(resolveColors(appConfig))
      : theme
    const overrides = (appConfig.ui as Record<string, unknown>)[name] as Record<string, unknown> | undefined
    // `extend: tv(base)` lets app-level overrides win key-by-key while still
    // inheriting the package default. Cast through `unknown` because `tv` is an
    // overloaded interface, not a generic function.
    const factory = tv({ extend: tv(base as never), ...(overrides || {}) } as never) as unknown as TVFactory
    perApp.set(name, factory)
    return factory
  })
  // The runtime factory is untyped (`TVFactory`); `ThemeTV<TTheme>` recovers
  // the theme's real slot keys for callers.
  const ui = computed(() => tvFactory.value(toValue(variants) as Parameters<TVFactory>[0])) as ComputedRef<ReturnType<ThemeTV<TTheme>>>
  return { ui }
}

/** Built `tv` factories per app config, keyed by component theme name. */
const factoryCache = new WeakMap<object, Map<string, TVFactory>>()

/**
 * The `tv` factory type for a theme. `tv` is an overloaded interface, so
 * `ReturnType<typeof tv<typeof theme>>` doesn't work — project the theme's
 * `slots` / `variants` into `TVReturnType` instead.
 */
export type ThemeTV<TTheme, R = ResolveTheme<TTheme>> = TVReturnType<
  R extends { variants: infer V } ? (V extends Record<string, any> ? V : any) : any,
  R extends { slots: infer S } ? (S extends Record<string, any> ? S : any) : any,
  // B (base) stays `any`; the rest must NOT be. `TVProps` branches on the
  // extend-variants param — `any` there widens every variant key to
  // `PropertyKey` and loses the literal `color` union.
  any, {}, {}, undefined, undefined
>

export type { ClassValue, VariantProps }
