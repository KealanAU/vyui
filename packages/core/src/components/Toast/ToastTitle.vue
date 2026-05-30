<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'

withDefaults(defineProps<PrimitiveProps>(), {
  as: 'text',
})

const a11y = useA11y(() => ({ role: 'heading' }))
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="a11y"
  >
    <slot />
  </Primitive>
</template>
