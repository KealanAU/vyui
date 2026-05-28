<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SelectViewportProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

withDefaults(defineProps<SelectViewportProps>(), {
  as: 'scroll-view',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
