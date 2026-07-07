import type { Config } from 'tailwindcss'
import { createLynxPreset } from '@lynx-js/tailwind-preset'
import vyuiPreset, { VYUI_UI_STATES } from '../../../packages/kit/src/tailwind.js'

// Extend the lynx preset's `uiVariants` with the extra `ui-*` state markers the
// kit themes use (`ui-on:`, `ui-dragging:`, …) — the class-based replacements
// for Lynx-incompatible `data-[state=…]` selectors (issue #9).
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
    '../../../packages/kit/src/**/*.{vue,js,ts}',
    '../../../packages/core/src/**/*.{vue,js,ts}',
  ],
  presets: [lynxPreset, vyuiPreset as Config],
}

export default config
