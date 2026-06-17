import type { Config } from 'tailwindcss'
import lynxPreset from '@lynx-js/tailwind-preset'
// Import directly from source so jiti (used by rsbuild-plugin-tailwindcss to
// evaluate this config file) resolves the file without requiring @vyui/kit to
// be pre-built. rspack itself never sees this import — jiti executes the config
// before rspack starts. Mirrors the content path pointing at `packages/kit/src/**`.
import vyuiPreset from '../../../packages/kit/src/tailwind.js'

const config: Config = {
  content: [
    './src/**/*.{vue,js,ts}',
    '../../../packages/kit/src/**/*.{vue,js,ts}',
    '../../../packages/core/src/**/*.{vue,js,ts}',
  ],
  presets: [lynxPreset, vyuiPreset as Config],
  theme: {
    extend: {
      // Brand palette. Remapping the stock Tailwind tokens (rather than adding
      // new classes) re-skins the whole demo in place AND flows through the
      // kit's neutral scale: `@vyui/kit/style.css` defines
      // `--ui-color-neutral-*: theme('colors.slate.*')`, so overriding `slate`
      // here recolors every kit component that paints `neutral` too.
      colors: {
        // Parchment White — every `bg-white`, plus the island's `bg-white/80`.
        'white': '#fdfcfc',
        'parchment-white': '#fdfcfc',
        // Ash Border — the borders + hairline dividers (slate-200 = neutral-200).
        'ash-border': '#e5e5e5',
        // Sunken surface — the under-sheet sidebar + the model pill sit on this
        // so they read as one tone (also `.vyai-undersheet` in index.css).
        'parchment-sunken': '#f1f0ef',
        slate: {
          200: '#e5e5e5',
        },
      },
    },
  },
}

export default config
