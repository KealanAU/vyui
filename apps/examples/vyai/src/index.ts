// MT-worklet propagation: vue-lynx's `worklet-loader-mt` only walks RELATIVE
// imports into the main-thread graph; bare specifiers like `@vyui/core` are
// silently skipped, so the MT bundle never registers any of our worklets and
// every touch crashes with `bind of undefined`. Drop a single side-effect
// relative import here so the walker can descend through core.
// @ts-expect-error — path resolves at build time via rspack; out of the
// demo's TS project file list. See `packages/core/src/index.ts`.
import '../../../../packages/core/src'

import { createApp } from 'vue-lynx'
import { VyUI } from '@vyui/kit'
import iconParkOutline from '@iconify-json/icon-park-outline/icons.json'
import iconParkSolid from '@iconify-json/icon-park-solid/icons.json'
import lucide from '@iconify-json/lucide/icons.json'
import tabler from '@iconify-json/tabler/icons.json'
import { installVyui } from '../../_shared/installVyui'
import App from './App.vue'
import { brandLogos } from './data/brand-icons'
import './index.css'

installVyui({
  lucide,
  'icon-park-outline': iconParkOutline,
  'icon-park-solid': iconParkSolid,
  tabler,
  // Just the Claude / OpenAI marks for the model picker — a trimmed `logos` set.
  logos: brandLogos,
})

const app = createApp(App)
app.use(VyUI)
app.mount()
