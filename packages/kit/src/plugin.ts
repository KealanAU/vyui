import type { App, Component, Plugin } from 'vue'
import { type VyUIPluginOptions } from './types'
import { provideVyUI } from './provide'
import { REGISTRY } from './components/registry'

/**
 * Vue plugin entry point: `createApp(App).use(VyUI, { ui: { primary: 'blue' } })`.
 *
 * `install()` provides the merged config under `APP_CONFIG_KEY` (see
 * `provideVyUI`), then imperatively registers components so SFCs can use
 * `<VyIcon />` without local imports. Every component in `REGISTRY` is
 * registered by default; pass `{ components }` to register a subset and let the
 * bundler drop the rest.
 *
 * Referencing `VyUI` pulls the full `REGISTRY` into the bundle — apps that want
 * theming without that cost should call `provideVyUI` directly.
 */
export const VyUI: Plugin<VyUIPluginOptions> = {
  install(app: App, options: VyUIPluginOptions = {}) {
    provideVyUI(app, options)

    // Theme injection works on any Vue-compatible runtime; global component
    // registration does not — vue-lynx's `createApp` returns an app with no
    // `component`, so this would throw. On Lynx the plugin is theme-only and
    // SFCs use named imports, which is the correct usage there anyway.
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
