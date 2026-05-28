import { createTV as createTVOriginal } from 'tailwind-variants'

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
