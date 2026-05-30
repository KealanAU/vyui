<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface DropdownMenuItemIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectDropdownMenuCheckboxItemContext } from './DropdownMenuCheckboxItem.vue'
import { injectDropdownMenuRadioItemContext } from './DropdownMenuRadioItem.vue'

withDefaults(defineProps<DropdownMenuItemIndicatorProps>(), {
  as: 'view',
})

const checkboxContext = injectDropdownMenuCheckboxItemContext(null)
const radioContext = injectDropdownMenuRadioItemContext(null)

const isActive = computed(() => {
  if (checkboxContext) {
    return checkboxContext.checked.value === true || checkboxContext.checked.value === 'indeterminate'
  }
  if (radioContext) {
    return radioContext.isChecked.value
  }
  return false
})
</script>

<template>
  <Primitive
    v-if="isActive"
    :as="as"
    :as-child="asChild"
    :accessibility-element="false"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
