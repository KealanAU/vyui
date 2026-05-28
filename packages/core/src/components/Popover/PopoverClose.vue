<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface PopoverCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverCloseProps>(), {
  as: 'view',
})

useForwardExpose()
const rootContext = injectPopoverRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    accessibility-traits="button"
    @tap="rootContext.onOpenChange(false)"
  >
    <slot />
  </Primitive>
</template>
