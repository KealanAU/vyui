<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ToastActionProps extends PrimitiveProps {
  /** A short description of the alternative action, for assistive tech. */
  altText?: string
}

export type ToastActionEmits = {
  /** Event handler called when the action is tapped. */
  'action': []
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectToastRootContext } from './ToastRoot.vue'

withDefaults(defineProps<ToastActionProps>(), {
  as: 'view',
})
const emits = defineEmits<ToastActionEmits>()

const context = injectToastRootContext()

function handleTap() {
  emits('action')
  context.onClose()
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    accessibility-traits="button"
    :accessibility-label="altText"
    @tap.stop="handleTap"
  >
    <slot />
  </Primitive>
</template>
