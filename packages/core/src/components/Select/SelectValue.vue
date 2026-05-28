<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SelectValueProps extends PrimitiveProps {
  /** The placeholder text to display when no value is selected. */
  placeholder?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectSelectRootContext } from './SelectRoot.vue'

const props = withDefaults(defineProps<SelectValueProps>(), {
  as: 'text',
  placeholder: '',
})

const rootContext = injectSelectRootContext()

const displayText = computed(() => {
  const value = rootContext.modelValue.value
  if (value === undefined || value === '') {
    return props.placeholder
  }
  return rootContext.itemLabels.value.get(value) ?? props.placeholder
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot>{{ displayText }}</slot>
  </Primitive>
</template>
