import { resolveColorHex, useAppConfig, useColorMode } from '@vyui/kit'

/**
 * Baked icon fills. Lynx rasterizes `<svg>`, so `text-*` classes /
 * `currentColor` never reach the glyph — VyIcon needs a literal hex via its
 * `color` prop (the same reason VyButton bakes `iconColor` internally).
 * Shades mirror the CSS tokens: accents ride the mode tier (-500 light /
 * -400 dark, like `text-primary`), `dimmed` mirrors `--ui-text-dimmed`
 * (neutral 400 light / 500 dark).
 */
export function useIconColors(): {
  accent: (semantic: string) => string
  dimmed: () => string
} {
  const appConfig = useAppConfig()
  const { isDark } = useColorMode()
  return {
    accent: semantic => resolveColorHex(appConfig, semantic, isDark.value ? 400 : 500),
    dimmed: () => resolveColorHex(appConfig, 'neutral', isDark.value ? 500 : 400),
  }
}
