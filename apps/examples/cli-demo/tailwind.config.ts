import type { Config } from 'tailwindcss'
import { createLynxPreset } from '@lynx-js/tailwind-preset'
// Both come from the preset the CLI copied in (`vyui init`), NOT from `@vyui/kit`:
// `vyui-preset.js` is kit's tailwind preset verbatim, so it also re-exports
// `VYUI_UI_STATES` — the extra `ui-*` state variants the kit themes rely on
// (issue #9). No hardcoded list, no kit dependency.
import vyuiPreset, { VYUI_UI_STATES } from './src/lib/vyui/vyui-preset.js'

const lynxPreset = createLynxPreset({
  lynxUIPlugins: {
    uiVariants: {
      prefixes: defaults => ({
        ...defaults,
        ui: [...defaults.ui, ...VYUI_UI_STATES],
      }),
    },
  },
})

const config: Config = {
  content: [
    // The CLI-installed components + this app's source.
    './src/**/*.{vue,js,ts}',
    // `@vyui/core` primitives the installed components compose.
    '../../../packages/core/src/**/*.{vue,js,ts}',
  ],
  presets: [lynxPreset, vyuiPreset as Config],
}

export default config
