<script lang="ts">
export interface DropdownMenuItemIndicatorProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { injectDropdownMenuCheckboxItemContext } from './DropdownMenuCheckboxItem.vue'
import { injectDropdownMenuRadioItemContext } from './DropdownMenuRadioItem.vue'

defineProps<DropdownMenuItemIndicatorProps>()

// Attempt to resolve from checkbox or radio context
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
  <slot v-if="isActive" />
</template>
