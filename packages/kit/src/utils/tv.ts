import { createTV as createTVOriginal } from 'tailwind-variants'
import type { AppConfig } from '../types'

/**
 * Public alias for the `createTV` config arg. `tailwind-variants` 0.3.x declares
 * `TVConfig` internally but doesn't re-export it from the package entry, so we
 * derive it from the function signature here and re-export.
 */
export type TVConfig = Parameters<typeof createTVOriginal>[0]

/**
 * Wrapper around `tailwind-variants`' `createTV` factory. Accepts an optional
 * config so callers (storybook, tests, ad-hoc usage outside a `VyUI` app) can
 * call it with no args. The real per-app `tv` factory is built inside
 * `VyUI.install()` and stored on the injected `AppConfig`.
 */
export const createTv = (config: TVConfig = {}) => createTVOriginal(config)

/**
 * Default singleton used when components are rendered outside an app context
 * (storybook, tests). Mirrors `tailwind-variants`' own default `tv` export.
 */
export const tv = createTv()

/**
 * Memoize a component's `buildX(appConfig)` theme factory on `appConfig`
 * identity. Building a factory (`tv({ extend: tv(theme(colors)) })`) is pure
 * for a given config but was being re-run per component INSTANCE — on Lynx's
 * interpreter that cost is visible whenever a screenful of components mounts
 * (e.g. a tab switch). The config object is stable per app (`VyUI.install()`
 * provides it once; the test fallback is a module constant), so one build per
 * app per component type is the correct cardinality.
 */
export function defineThemeBuilder<T>(build: (appConfig: AppConfig) => T): (appConfig: AppConfig) => T {
  const cache = new WeakMap<AppConfig, T>()
  return (appConfig: AppConfig) => {
    let factory = cache.get(appConfig)
    if (factory === undefined) {
      factory = build(appConfig)
      cache.set(appConfig, factory)
    }
    return factory
  }
}
