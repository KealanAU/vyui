// MT-worklet propagation: vue-lynx's `worklet-loader-mt` only walks RELATIVE
// imports into the main-thread graph; bare specifiers like `@vyui/core` are
// silently skipped, so the MT bundle never registers any of our worklets and
// every touch crashes with `bind of undefined`. Drop a single side-effect
// relative import here so the walker can descend through core.
// @ts-expect-error — path resolves at build time via rspack; out of the
// demo's TS project file list. See `packages/core/src/index.ts`.
import '../../../../packages/core/src'

import { installIntlPolyfill, registerIconSet } from '@vyui/core'
import { createApp } from 'vue-lynx'
import { VyUI } from '@vyui/kit'
import lucide from '@iconify-json/lucide/icons.json'
import App from './App.vue'
import './index.css'

// Lynx's PrimJS engine ships an incomplete `Intl`; install the shim before
// any component constructs a date/number formatter. No-op on web.
installIntlPolyfill()

// lucide covers both the VyUI defaults (`loading`, `check`) and every icon the
// demo uses (deck icons, chevrons, trophy, sun/moon).
registerIconSet('lucide', lucide)

const app = createApp(App)
app.use(VyUI)
app.mount()
