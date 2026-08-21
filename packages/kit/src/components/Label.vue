<script lang="ts">
import theme from '../theme/label'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type LabelTV = ThemeTV<typeof theme>
type LabelVariants = VariantProps<LabelTV>

export interface LabelProps {
  /** The id of the form control this label is associated with. */
  for?: string
  size?: LabelVariants['size']
  required?: boolean
  class?: ClassValue
  ui?: Partial<Record<keyof LabelTV['slots'], ClassValue>>
}

export interface LabelSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { Label as CoreLabel } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<LabelProps>(), {})
defineSlots<LabelSlots>()

const { ui } = useStyledComponent('label', theme, () => ({
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
