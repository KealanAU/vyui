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
import { useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectToastRootContext } from './ToastRoot.vue'

const props = withDefaults(defineProps<ToastActionProps>(), {
  as: 'view',
})
const emits = defineEmits<ToastActionEmits>()

const context = injectToastRootContext()

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'button',
  label: props.altText || (attrs['accessibility-label'] as string | undefined),
}))

function handleTap() {
  emits('action')
  context.onClose()
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="a11y"
    @tap.stop="handleTap"
  >
    <slot />
  </Primitive>
</template>
