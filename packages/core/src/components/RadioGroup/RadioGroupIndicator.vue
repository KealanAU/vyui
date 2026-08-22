<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface RadioGroupIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectRadioGroupItemContext } from './RadioGroupItem.vue'

withDefaults(defineProps<RadioGroupIndicatorProps>(), {
  as: 'view',
})

const { forwardRef } = useForwardExpose()
const itemContext = injectRadioGroupItemContext()
</script>

<template>
  <Primitive
    v-if="itemContext.checked.value"
    :ref="forwardRef"
    :data-state="itemContext.checked.value ? 'checked' : 'unchecked'"
    :data-disabled="itemContext.disabled.value ? '' : undefined"
    :as-child="asChild"
    :as="as"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
