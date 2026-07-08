import type { Config } from 'tailwindcss'
import { createLynxPreset } from '@lynx-js/tailwind-preset'
import { COLORS, createVyuiPreset, VYUI_UI_STATES } from '@vyui/kit/tailwind'

// Extend the lynx preset's `uiVariants` with the extra `ui-*` state markers the
// kit themes use — the class-based replacements for Lynx-incompatible
// `data-[state=…]` selectors (issue #9). Mirrors kit-demo.
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
  presets: [lynxPreset, createVyuiPreset({ colors: [...COLORS] }) as Config],
}

export default config
