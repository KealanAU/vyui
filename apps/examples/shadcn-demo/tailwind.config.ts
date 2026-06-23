import type { Config } from 'tailwindcss'
import { createLynxPreset } from '@lynx-js/tailwind-preset'
import { COLORS, createVyuiPreset, VYUI_UI_STATES } from '@vyui/kit/tailwind'

// Same Lynx + @vyui/kit preset stack as kit-demo. The `ui-*` state markers are
// the class-based replacements for Lynx-incompatible `data-[state=…]` selectors.
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
  presets: [lynxPreset, createVyuiPreset({ colors: COLORS }) as Config],
}

export default config
