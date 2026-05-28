<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SelectItemIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectSelectItemContext } from './SelectItem.vue'

withDefaults(defineProps<SelectItemIndicatorProps>(), {
  as: 'view',
})

const itemContext = injectSelectItemContext()
</script>

<template>
  <Primitive
    v-if="itemContext.isSelected.value"
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
