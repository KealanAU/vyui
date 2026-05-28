<script lang="ts">
import type { AcceptableValue } from '@/shared/types'
import type { ToggleProps } from '@/components/Toggle'
import { isValueEqualOrExist, useForwardExpose } from '@/shared'

export interface ToggleGroupItemProps extends Omit<ToggleProps, 'name' | 'required' | 'modelValue' | 'defaultValue'> {
  /**
   * A string value for the toggle group item. All items within a toggle group should use a unique value.
   */
  value: AcceptableValue
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Toggle } from '@/components/Toggle'
import { injectToggleGroupRootContext } from './ToggleGroupRoot.vue'

const props = withDefaults(defineProps<ToggleGroupItemProps>(), {
  as: 'view',
})

const rootContext = injectToggleGroupRootContext()
const disabled = computed(() => rootContext.disabled?.value || props.disabled)
const pressed = computed(() => isValueEqualOrExist(rootContext.modelValue.value, props.value))

const { forwardRef } = useForwardExpose()
</script>

<template>
  <Toggle
    v-bind="props"
    :ref="forwardRef"
    v-slot="slotProps"
    :disabled="disabled"
    :model-value="pressed"
    @update:model-value="rootContext.changeModelValue(value)"
  >
    <slot v-bind="slotProps" />
  </Toggle>
</template>
