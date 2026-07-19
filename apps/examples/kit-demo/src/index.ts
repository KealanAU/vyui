import { createApp } from 'vue-lynx'
import { COLORS, VyUI } from '@vyui/kit'
import { installVyui } from '../../_shared/installVyui'
import { iconParkOutline, lucide } from './icons.generated'
import App from './App.vue'
import './index.css'

// Generated SUBSETS of lucide (VyUI defaults like `loading`/`check`) and
// icon-park-outline (the demo screen) — the full sets are ~1.5 MB of JSON,
// parsed on the background thread at startup, for ~60 used glyphs. After
// adding an icon name, regenerate with `pnpm gen:icons`.
installVyui({ 'lucide': lucide, 'icon-park-outline': iconParkOutline })

const app = createApp(App)
// Register a custom semantic color (`tertiary`) alongside the defaults — the
// runtime half of the "add a color" flow. Paired with the Tailwind preset
// (tailwind.config.ts), CSS vars (index.css) and the type registry
// augmentation (vyui-colors.d.ts).
app.use(VyUI, { ui: { colors: [...COLORS, 'tertiary'] } })
app.mount()
