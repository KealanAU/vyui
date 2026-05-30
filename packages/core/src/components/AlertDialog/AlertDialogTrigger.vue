<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

const props = withDefaults(defineProps<AlertDialogTriggerProps>(), {
  as: 'view',
})

const rootContext = injectAlertDialogRootContext()

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
    @tap="rootContext.onOpenChange(true)"
  >
    <slot />
  </Primitive>
</template>
