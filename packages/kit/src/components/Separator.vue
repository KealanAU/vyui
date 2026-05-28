<script lang="ts">
import theme from '../theme/separator'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type SeparatorTV = ThemeTV<typeof theme>
type SeparatorVariants = VariantProps<SeparatorTV>

export interface SeparatorProps {
  /** Display a label in the middle. */
  label?: string
  /** Iconify name shown in the middle. */
  icon?: string
  color?: SeparatorVariants['color']
  size?: SeparatorVariants['size']
  type?: SeparatorVariants['type']
  /** @defaultValue 'horizontal' */
  orientation?: SeparatorVariants['orientation']
  /** Forwarded to the underlying Separator primitive — strips a11y attrs. */
  decorative?: boolean
  class?: any
  ui?: Partial<Record<keyof SeparatorTV['slots'], any>>
}

export interface SeparatorSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Separator as CoreSeparator, Icon as VyIcon } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
})
defineSlots<SeparatorSlots>()
const slots = useSlots()

const { ui } = useStyledComponent('separator', theme, () => ({
  color: props.color,
  orientation: props.orientation,
  size: props.size,
  type: props.type,
}))

const hasContent = computed(() => !!(props.label || props.icon || slots.default))
</script>

<template>
  <CoreSeparator
    :orientation="orientation"
    :decorative="decorative"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
  >
    <view :class="ui.border({ class: props.ui?.border })" />

    <template v-if="hasContent">
      <view :class="ui.container({ class: props.ui?.container })">
        <slot>
          <text v-if="label" :class="ui.label({ class: props.ui?.label })">{{ label }}</text>
          <VyIcon v-else-if="icon" :name="icon" :class="ui.icon({ class: props.ui?.icon })" />
        </slot>
      </view>

      <view :class="ui.border({ class: props.ui?.border })" />
    </template>
  </CoreSeparator>
</template>
