import type { Config } from 'tailwindcss'
import lynxPreset from '@lynx-js/tailwind-preset'
// Import directly from source so jiti (used by rsbuild-plugin-tailwindcss to
// evaluate this config file) resolves the file without requiring @vyui/kit to
// be pre-built. rspack itself never sees this import — jiti executes the config
// before rspack starts. This mirrors the content path already pointing at
// `packages/kit/src/**`. Same approach would apply to linear-demo / kit-demo.
import vyuiPreset from '../../../packages/kit/src/tailwind.js'

const config: Config = {
  content: [
    './src/**/*.{vue,js,ts}',
    '../../../packages/kit/src/**/*.{vue,js,ts}',
    '../../../packages/core/src/**/*.{vue,js,ts}',
  ],
  presets: [lynxPreset, vyuiPreset as Config],
}

export default config
