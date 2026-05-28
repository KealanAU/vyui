<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxCancelProps extends PrimitiveProps {
  /** Accessibility label announced by assistive tech. Localize as needed. */
  accessibilityLabel?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

withDefaults(defineProps<ComboboxCancelProps>(), {
  as: 'view',
})

const rootContext = injectComboboxRootContext()

function handleTap() {
  // Reset the search to show all options.
  rootContext.filterSearch.value = ''

  if (rootContext.resetModelValueOnClear.value)
    rootContext.modelValue.value = rootContext.multiple.value ? [] : null
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    accessibility-traits="button"
    :accessibility-label="accessibilityLabel"
    v-bind="$attrs"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
