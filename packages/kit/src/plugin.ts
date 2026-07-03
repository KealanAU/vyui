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

    const components = options.components ?? REGISTRY
    for (const [name, comp] of Object.entries(components)) {
      app.component(name, comp as Component)
    }
  },
}
