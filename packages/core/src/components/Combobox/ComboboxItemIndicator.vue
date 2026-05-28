<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxItemIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectComboboxItemContext } from './ComboboxItem.vue'

withDefaults(defineProps<ComboboxItemIndicatorProps>(), {
  as: 'view',
})

const itemContext = injectComboboxItemContext()
</script>

<template>
  <Primitive
    v-if="itemContext.isSelected.value"
    :as="as"
    :as-child="asChild"
    :accessibility-element="false"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
