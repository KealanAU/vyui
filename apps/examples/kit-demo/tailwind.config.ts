import type { Config } from 'tailwindcss'
import lynxPreset from '@lynx-js/tailwind-preset'
import vyuiPreset from '@vyui/kit/tailwind'

// Lynx-targeted Tailwind v3 config. Two presets:
//   - `@lynx-js/tailwind-preset`: utility set + variants Lynx understands.
//   - `@vyui/kit/tailwind`: semantic color names + safelist for @vyui/kit themes.
const config: Config = {
  content: [
    './src/**/*.{vue,js,ts}',
    '../../../packages/kit/src/**/*.{vue,js,ts}',
    '../../../packages/core/src/**/*.{vue,js,ts}',
  ],
  presets: [lynxPreset, vyuiPreset as Config],
}

export default config
