import type { App } from 'vue'
import { defu } from 'defu'
import { APP_CONFIG_KEY, type AppConfig, type VyUIPluginOptions } from './types'
import { defaultConfig } from './composables/useAppConfig'

/**
 * Provide the merged `@vyui/kit` theme config WITHOUT registering any
 * components. Intentionally imports no component (or the `REGISTRY`), so a
 * bundler can tree-shake the whole component set for apps that use named
 * imports (`import { VyButton } from '@vyui/kit'`) and only want theming:
 *
 * ```ts
 * import { provideVyUI } from '@vyui/kit'
 * provideVyUI(app, { ui: { primary: 'blue' } })
 * ```
 *
 * `app.use(VyUI)` is the batteries-included alternative that also registers
 * every `Vy*` component globally — reach for that when you rely on global
 * component usage in templates.
 */
export function provideVyUI(app: App, options: VyUIPluginOptions = {}): void {
  const merged = defu({ ui: options.ui ?? {} }, defaultConfig) as AppConfig
  app.provide(APP_CONFIG_KEY, merged)
}
