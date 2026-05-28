<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface PopoverTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverTriggerProps>(), {
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
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @tap="rootContext.onOpenToggle"
  >
    <slot />
  </Primitive>
</template>
