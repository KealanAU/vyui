import { inject } from 'vue'
import { APP_CONFIG_KEY, type AppConfig } from '@/lib/vyui/types'
import icons from '@/lib/vyui/theme/icons'

/**
 * Fallback config used when components are rendered outside a `VyUI` app
 * context (storybook, isolated tests). Keeps the icon registry intact so
 * `useComponentIcons` still resolves semantic names.
 */
const FALLBACK_CONFIG: AppConfig = {
  ui: {
    icons,
    primary: 'green',
    gray: 'slate',
  },
}

/** Inject the merged `AppConfig` provided by `VyUI.install()`. */
export const useAppConfig = (): AppConfig => inject(APP_CONFIG_KEY, FALLBACK_CONFIG)
