import { createApp } from 'vue-lynx'
import { installIntlPolyfill, registerIconSet } from '@vyui/core'
import { provideVyUI } from '@vyui/kit'
import lucide from '@iconify-json/lucide/icons.json'
import vyuiConfig from '../vyui.config'
import App from './App.vue'
import './index.css'

// Lynx's PrimJS engine lacks full `Intl` — no-op on web.
installIntlPolyfill()
// Kit's defaults use `lucide` icons; register the set up front.
registerIconSet('lucide', lucide)

const app = createApp(App)
// Native path: vue-lynx's `createApp` has no `app.component`, so `provideVyUI`
// (theme-only) plus local deep imports is the correct usage here.
provideVyUI(app, vyuiConfig)
app.mount()
