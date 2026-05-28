<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

withDefaults(defineProps<ComboboxSeparatorProps>(), {
  as: 'view',
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
