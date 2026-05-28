<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface CollapsibleTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'

const props = withDefaults(defineProps<CollapsibleTriggerProps>(), {
  as: 'view',
})

useForwardExpose()
const rootContext = injectCollapsibleRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    accessibility-traits="button"
    :aria-controls="rootContext.contentId || undefined"
    :aria-expanded="rootContext.open.value || false"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-disabled="rootContext.disabled?.value ? '' : undefined"
    :disabled="rootContext.disabled?.value"
    @tap="rootContext.onOpenToggle"
  >
    <slot />
  </Primitive>
</template>
