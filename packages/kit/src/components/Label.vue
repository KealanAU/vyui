<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/label'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.label`.
 */
export const buildLabel = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as any).label as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
})

type LabelVariants = VariantProps<ReturnType<typeof buildLabel>>

export interface LabelProps {
  /** The id of the form control this label is associated with. */
  for?: string
  size?: LabelVariants['size']
  required?: boolean
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildLabel>['slots'], any>>
}

export interface LabelSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Label as CoreLabel } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<LabelProps>(), {})
defineSlots<LabelSlots>()

const appConfig = useAppConfig()
const ui = computed(() => buildLabel(appConfig)({
  size: props.size,
  required: props.required,
}))
</script>

<template>
  <CoreLabel
    :for="props.for"
    :class="ui.base({ class: [props.class, props.ui?.base] })"
  >
    <slot />
  </CoreLabel>
</template>
