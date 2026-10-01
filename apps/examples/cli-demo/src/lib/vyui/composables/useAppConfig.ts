import { inject } from 'vue'
import { APP_CONFIG_KEY, type AppConfig } from '@/lib/vyui/types'
import icons from '@/lib/vyui/theme/icons'

/**
 * Package-level defaults. `provideVyUI` deep-merges user options on top; it is
 * also the fallback when a component renders outside a `VyUI` app context
 * (storybook, isolated tests), so the icon registry stays intact.
 */
export const defaultConfig: AppConfig = {
  ui: {
    icons,
    primary: 'green',
    gray: 'slate',
  },
}

/** Inject the merged `AppConfig` provided by `VyUI.install()`. */
export const useAppConfig = (): AppConfig => inject(APP_CONFIG_KEY, defaultConfig)
