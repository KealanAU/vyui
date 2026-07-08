import { createApp } from 'vue-lynx'
import lucide from '@iconify-json/lucide/icons.json'
// `VyUI` + the components come from the CLI-installed files under `@/...`, NOT
// from `@vyui/kit`. This app has no `@vyui/kit` dependency — that's the point.
import { VyUI } from '@/lib/vyui/plugin'
import { installVyui } from '../../_shared/installVyui'
import App from './App.vue'
import './index.css'
import '@/lib/vyui/style.css'

installVyui({ lucide })

const app = createApp(App)
// `default` style — green primary, slate neutral (the baked plugin defaults).
app.use(VyUI)
app.mount()
