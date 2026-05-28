<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectToastRootContext } from './ToastRoot.vue'

withDefaults(defineProps<PrimitiveProps>(), {
  as: 'view',
})

const context = injectToastRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    accessibility-traits="button"
    accessibility-label="Close"
    @tap.stop="context.onClose()"
  >
    <slot />
  </Primitive>
</template>
