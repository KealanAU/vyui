import type { Config } from 'tailwindcss'
import lynxPreset from '@lynx-js/tailwind-preset'
import vyuiPreset from '@vyui/kit/tailwind'

const config: Config = {
  content: [
    './src/**/*.{vue,js,ts}',
    '../../../packages/kit/src/**/*.{vue,js,ts}',
    '../../../packages/core/src/**/*.{vue,js,ts}',
  ],
  presets: [lynxPreset, vyuiPreset as Config],
}

export default config
