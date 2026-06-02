import type { Config } from 'tailwindcss'
import lynxPreset from '@lynx-js/tailwind-preset'
import { COLORS, createVyuiPreset } from '@vyui/kit/tailwind'

// Lynx-targeted Tailwind v3 config. Two presets:
//   - `@lynx-js/tailwind-preset`: utility set + variants Lynx understands.
//   - `@vyui/kit/tailwind`: semantic color names + safelist for @vyui/kit themes.
//
// `createVyuiPreset({ colors })` registers the custom `tertiary` color (scale +
// safelist) — the Tailwind half of the "add a color" flow. Keep this list in
// sync with `app.use(VyUI, { ui: { colors } })` in src/index.ts.
const config: Config = {
  content: [
    './src/**/*.{vue,js,ts}',
    '../../../packages/kit/src/**/*.{vue,js,ts}',
    '../../../packages/core/src/**/*.{vue,js,ts}',
  ],
  presets: [lynxPreset, createVyuiPreset({ colors: [...COLORS, 'tertiary'] }) as Config],
}

export default config
