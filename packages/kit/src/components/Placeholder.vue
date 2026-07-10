<script lang="ts">
import { tv } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/placeholder'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.placeholder`.
 */
export const buildPlaceholder = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).placeholder as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
})

export interface PlaceholderProps {
  class?: any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '../composables/useAppConfig'

const props = defineProps<PlaceholderProps>()

const appConfig = useAppConfig()
const ui = computed(() => buildPlaceholder(appConfig))

// Diagonal hatch via repeating-linear-gradient — scales with the element at
// any size and needs no SVG sizing tricks. On Lynx an `<svg>` rasterizes at
// a fixed point, which made the previous SVG approach blur or clip when the
// container grew beyond the rasterization size. The gradient is painted by
// the layout engine each frame, so an `h-48` panel looks the same as an
// `h-12` chip — exactly what a layout-stub placeholder should do.
//
// `9 9` keeps the stripe pitch dense enough to read on a phone screen;
// 1.5px stroke + neutral/slate at ~8% gives enough contrast on the `bg-muted` fill
// without dominating any real content layered above (e.g. demo labels).
const hatchStyle = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(15,23,42,0.08) 0, rgba(15,23,42,0.08) 1.5px, transparent 1.5px, transparent 9px)',
}
</script>

<template>
  <view :class="ui({ class: props.class })" :style="hatchStyle" />
</template>
