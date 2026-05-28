<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

withDefaults(defineProps<PrimitiveProps>(), {
  as: 'text',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    accessibility-traits="header"
  >
    <slot />
  </Primitive>
</template>
