<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxArrowProps extends PrimitiveProps {
  /** The width of the arrow in pixels. */
  width?: number
  /** The height of the arrow in pixels. */
  height?: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

withDefaults(defineProps<ComboboxArrowProps>(), {
  as: 'view',
  width: 10,
  height: 5,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :accessibility-element="false"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
