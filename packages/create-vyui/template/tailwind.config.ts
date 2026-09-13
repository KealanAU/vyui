import type { Config } from 'tailwindcss'
import { createLynxPreset } from '@lynx-js/tailwind-preset'
import { createVyuiPreset, VYUI_UI_STATES } from '@vyui/kit/tailwind'
import vyuiConfig from './vyui.config'

// Extend the Lynx preset's `uiVariants` with the extra `ui-*` state markers
// the kit themes use (`ui-on:`, `ui-dragging:`, …) — the class-based
// replacements for Lynx-incompatible `data-[state=…]` selectors.
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
    './src/**/*.{vue,js,ts}',
    // Scan kit + core so their utility classes are not purged.
    './node_modules/@vyui/kit/dist/**/*.js',
    './node_modules/@vyui/core/dist/**/*.js',
  ],
  presets: [lynxPreset, createVyuiPreset(vyuiConfig) as Config],
}

export default config
