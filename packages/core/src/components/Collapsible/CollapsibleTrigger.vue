<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface CollapsibleTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'

const props = withDefaults(defineProps<CollapsibleTriggerProps>(), {
  as: 'view',
})

useForwardExpose()
const rootContext = injectCollapsibleRootContext()

const a11y = useA11y(() => ({
  role: 'button',
  disabled: rootContext.disabled?.value,
  state: rootContext.open.value ? 'expanded' : 'collapsed',
}))
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    v-bind="a11y"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-disabled="rootContext.disabled?.value ? '' : undefined"
    :disabled="rootContext.disabled?.value"
    @tap="rootContext.onOpenToggle"
  >
    <slot />
  </Primitive>
</template>
