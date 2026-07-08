// MT-worklet propagation: vue-lynx's `worklet-loader-mt` only walks RELATIVE
// imports into the main-thread graph; bare specifiers like `@vyui/core` are
// silently skipped. Drop a single side-effect relative import so the walker
// descends through core (same as kit-demo).
// @ts-expect-error — resolves at build time via rspack; outside the demo's TS project.
import '../../../../packages/core/src'

import { createApp } from 'vue-lynx'
import { VyUI } from '@vyui/kit'
import lucide from '@iconify-json/lucide/icons.json'
import { installVyui } from '../../_shared/installVyui'
import App from './App.vue'
import './index.css'

installVyui({ lucide })

const app = createApp(App)

// ── This is the shadcn style, applied at runtime ────────────────────────────
// Mirrors what `vyui init --style shadcn` bakes into the generated plugin:
//   • primary → zinc  (monochrome accent; aligns SVG icon fills with the tokens)
//   • button default → neutral  (the near-black shadcn solid button)
// The shadcn radius (0.5rem) + primary→zinc CSS vars live in index.css.
app.use(VyUI, {
  ui: {
    primary: 'zinc',
    button: { defaultVariants: { color: 'neutral' } },
  },
})
app.mount()
