<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

const props = withDefaults(defineProps<AlertDialogTriggerProps>(), {
  as: 'view',
})

const rootContext = injectAlertDialogRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    accessibility-traits="button"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @tap="rootContext.onOpenChange(true)"
  >
    <slot />
  </Primitive>
</template>
