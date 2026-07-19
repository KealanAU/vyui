import { createApp } from 'vue-lynx'
import { VyUI } from '@vyui/kit'
import iconParkOutline from '@iconify-json/icon-park-outline/icons.json'
import iconParkSolid from '@iconify-json/icon-park-solid/icons.json'
import lucide from '@iconify-json/lucide/icons.json'
import tabler from '@iconify-json/tabler/icons.json'
import { installVyui } from '../../_shared/installVyui'
import App from './App.vue'
import './index.css'

installVyui({
  lucide,
  'icon-park-outline': iconParkOutline,
  'icon-park-solid': iconParkSolid,
  tabler,
})

const app = createApp(App)
app.use(VyUI)
app.mount()
