<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface PopoverTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverTriggerProps>(), {
  as: 'view',
})

useForwardExpose()
const rootContext = injectPopoverRootContext()

const a11y = useA11y(() => ({
  role: 'button',
  state: rootContext.open.value ? 'expanded' : 'collapsed',
}))
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    v-bind="a11y"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @tap="rootContext.onOpenToggle"
  >
    <slot />
  </Primitive>
</template>
