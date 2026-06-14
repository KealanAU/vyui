import type { App, Component, Plugin } from 'vue'
import { defu } from 'defu'
import { APP_CONFIG_KEY, type AppConfig, type VyUIPluginOptions } from './types'
import icons from './theme/icons'
import { REGISTRY } from './components/registry'

/**
 * Package-level defaults. User options are deep-merged on top via `defu`.
 */
const defaultConfig: AppConfig = {
  ui: {
    icons,
    primary: 'green',
    gray: 'slate',
  },
}

/**
 * Vue plugin entry point. Use as:
 *
 * ```ts
 * import { createApp } from 'vue'
 * import { VyUI } from '@vyui/kit'
 * createApp(App).use(VyUI, { ui: { primary: 'blue' } })
 * ```
 *
 * `install()`:
 *  1. Deep-merges user `ui` options over the package defaults.
 *  2. Provides the merged config under `APP_CONFIG_KEY`.
 *  3. Imperatively registers every component in `REGISTRY` so SFCs can use
 *     `<VyIcon />` etc. without local imports (replaces nuxt/ui's
 *     unplugin-vue-components auto-import flow).
 */
export const VyUI: Plugin<VyUIPluginOptions> = {
  install(app: App, options: VyUIPluginOptions = {}) {
    const merged = defu({ ui: options.ui ?? {} }, defaultConfig) as AppConfig

    app.provide(APP_CONFIG_KEY, merged)

    for (const [name, comp] of Object.entries(REGISTRY)) {
      app.component(name, comp as Component)
    }
  },
}
