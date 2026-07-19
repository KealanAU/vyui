import { createApp } from 'vue-lynx'
import { VyUI } from '@vyui/kit'
import lucide from '@iconify-json/lucide/icons.json'
import { installVyui } from '../../_shared/installVyui'
import App from './App.vue'
import './index.css'

installVyui({ lucide })

const app = createApp(App)
app.use(VyUI)
app.mount()
