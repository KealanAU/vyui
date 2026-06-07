import type { Config } from 'tailwindcss'
import { createLynxPreset } from '@lynx-js/tailwind-preset'
import { COLORS, createVyuiPreset, VYUI_UI_STATES } from '@vyui/kit/tailwind'

// Extend the lynx preset's `uiVariants` with the extra `ui-*` state markers the
// kit themes use (`ui-on:`, `group-ui-completed:`, …) — the class-based
// replacements for Lynx-incompatible `data-[state=…]` selectors (issue #9).
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
