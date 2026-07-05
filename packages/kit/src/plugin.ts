import type { App, Component, Plugin } from 'vue'
import { type VyUIPluginOptions } from './types'
import { provideVyUI } from './provide'
import { REGISTRY } from './components/registry'

/**
 * Vue plugin entry point. Use as:
 *
 * ```ts
 * import { createApp } from 'vue-lynx'
 * import { VyUI } from '@vyui/kit'
 * createApp(App).use(VyUI, { ui: { primary: 'blue' } })
 * ```
 *
 * `install()`:
 *  1. Provides the merged config under `APP_CONFIG_KEY` (see `provideVyUI`).
 *  2. Imperatively registers components so SFCs can use `<VyIcon />` etc.
 *     without local imports (replaces nuxt/ui's unplugin-vue-components
 *     auto-import flow). By default every component in `REGISTRY` is
 *     registered; pass `{ components }` to register only a chosen subset and
 *     let the bundler drop the rest.
 *
 * Referencing `VyUI` pulls the full `REGISTRY` (every component) into the
 * bundle. Apps that want theming without that cost should call `provideVyUI`
 * directly and rely on named component imports instead.
 */
export const VyUI: Plugin<VyUIPluginOptions> = {
  install(app: App, options: VyUIPluginOptions = {}) {
    provideVyUI(app, options)

    // Theme injection (above) works on any Vue-compatible runtime. Global
    // component registration does not: vue-lynx's `createApp` returns an app
    // with `provide`/`use` but no `component`, so calling it would throw
    // `app.component is not a function`. Guard it — on Lynx the plugin becomes
    // theme-only and SFCs use named imports (`import { VyButton } from
    // '@vyui/kit'`), which is the correct usage there anyway.
    if (typeof app.component !== 'function') {
      if (__DEV__) {
        console.warn(
          '[vyui] `app.component` is unavailable on this runtime (e.g. vue-lynx); '
          + 'skipping global component registration. Import components locally instead: '
          + "`import { VyButton } from '@vyui/kit'`.",
        )
      }
      return
    }

    const components = options.components ?? REGISTRY
    for (const [name, comp] of Object.entries(components)) {
      app.component(name, comp as Component)
    }
  },
}
