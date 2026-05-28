<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxEmptyProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

withDefaults(defineProps<ComboboxEmptyProps>(), {
  as: 'view',
})

const rootContext = injectComboboxRootContext()

const isRender = computed(() => {
  if (rootContext.ignoreFilter.value)
    return rootContext.allItems.value.size === 0
  return rootContext.filterState.value.count === 0
})
</script>

<template>
  <Primitive
    v-if="isRender"
    :as="as"
    :as-child="asChild"
    data-combobox-empty=""
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
