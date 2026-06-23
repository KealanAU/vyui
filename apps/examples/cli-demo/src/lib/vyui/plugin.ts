import type { App, Plugin } from 'vue'
import { defu } from 'defu'
import { APP_CONFIG_KEY, type AppConfig, type VyUIPluginOptions } from '@/lib/vyui/types'
import icons from '@/lib/vyui/theme/icons'

const styleDefaults = {
  "primary": "green"
}

/**
 * Package-level defaults; user options are deep-merged on top via `defu`.
 * Per-component theme overrides baked in here are picked up by each component
 * via `appConfig.ui[name]` → `tv({ extend: tv(base), ...overrides })`.
 */
const defaultConfig: AppConfig = {
  ui: { icons, gray: 'slate', ...styleDefaults },
}

/**
 * Vue plugin. Provides the merged `AppConfig` consumed by `useAppConfig`.
 * Register it once with your lib alias, e.g.
 * `createApp(App).use(VyUI, { ui: { primary: 'blue' } })`.
 */
export const VyUI: Plugin<VyUIPluginOptions> = {
  install(app: App, options: VyUIPluginOptions = {}) {
    const merged = defu({ ui: options.ui ?? {} }, defaultConfig) as AppConfig
    app.provide(APP_CONFIG_KEY, merged)
  },
}
