import { createTV as createTVOriginal } from 'tailwind-variants'

/**
 * Public alias for the `createTV` config arg: `tailwind-variants` 0.3.x declares
 * `TVConfig` internally but never re-exports it, so it is derived from the
 * function signature here.
 */
export type TVConfig = Parameters<typeof createTVOriginal>[0]

/**
 * Wrapper around `tailwind-variants`' `createTV` factory, with an optional
 * config so callers outside a `VyUI` app can call it with no args. The real
 * per-app `tv` factory is built inside `VyUI.install()`.
 */
export const createTv = (config: TVConfig = {}) => createTVOriginal(config)

/** Default singleton for components rendered outside an app context (storybook,
 *  tests). Mirrors `tailwind-variants`' own default `tv` export. */
export const tv = createTv()
