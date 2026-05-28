<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface LabelProps extends PrimitiveProps {
  /** The id of the element the label is associated with. */
  for?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<LabelProps>(), {
  as: 'text',
})

useForwardExpose()
</script>

<template>
  <Primitive v-bind="props">
    <slot />
  </Primitive>
</template>
