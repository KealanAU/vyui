<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface DialogOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogOverlayImplProps>(), {
  as: 'view',
})

const rootContext = injectDialogRootContext()
useForwardExpose()

// reka-ui calls `useBodyScrollLock(true)` here; there is no document body to
// lock on Lynx, so scroll-lock is intentionally omitted.

function handleTap() {
  if (rootContext.modal.value)
    rootContext.onOpenChange(false)
}
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
