import { createApp } from 'vue-lynx'
import { installIntlPolyfill, registerIconSet } from '@vyui/core'
import { provideVyUI } from '@vyui/kit/provide'
import lucide from '@iconify-json/lucide/icons.json'
import vyuiConfig from '../vyui.config'
import App from './App.vue'
import './index.css'

// Lynx's PrimJS engine lacks full `Intl` — no-op on web.
installIntlPolyfill()
// Kit's defaults use `lucide` icons.
registerIconSet('lucide', lucide)

const app = createApp(App)
// vue-lynx's `createApp` has no `app.component`, so `app.use(VyUI)` can't
// register components here — provide the theme and deep-import components.
provideVyUI(app, vyuiConfig)
app.mount()
