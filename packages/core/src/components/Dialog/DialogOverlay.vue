<script lang="ts">
import type { DialogOverlayImplProps } from './DialogOverlayImpl.vue'

export interface DialogOverlayProps extends DialogOverlayImplProps {}
</script>

<script setup lang="ts">
import { getCurrentInstance, h, onUnmounted, useAttrs, useSlots, watch } from 'vue'
import { useForwardExpose, useId } from '@/shared'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot'
import DialogOverlayImpl from './DialogOverlayImpl.vue'
import { injectDialogRootContext } from './DialogRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<DialogOverlayProps>()

const rootContext = injectDialogRootContext()
useForwardExpose()

// --- Overlay-portal registration -------------------------------------------
// reka-ui wraps `DialogOverlayImpl` in `<Presence :show="...">` and lets
// `<Teleport>` portal it. Lynx has neither: the backdrop paints through the
// `overlayStore` portal painted by the app-root `<OverlayRoot>`, and the
// `watch` below IS the Presence equivalent — it register/unregisters as the
// dialog opens/closes. Registering here (before `DialogContent` mounts) keeps
// the backdrop stacked underneath the content. Overlay only renders for a
// modal dialog, matching reka's `v-if="rootContext?.modal.value"`.
const attrs = useAttrs()
const slots = useSlots()
const id = useId()
const capturedProvides = (getCurrentInstance() as
  | { provides?: Record<any, any> }
  | null)?.provides

function render() {
  return h(
    DialogOverlayImpl,
    { as: props.as, asChild: props.asChild, ...attrs },
    () => slots.default?.(),
  )
}

watch(
  () => rootContext.modal.value && rootContext.open.value,
  (isPresent) => {
    if (isPresent)
      registerOverlay(id, render, capturedProvides)
    else
      unregisterOverlay(id)
  },
  { immediate: true },
)

onUnmounted(() => unregisterOverlay(id))
</script>

<template>
  <!-- backdrop is painted through the OverlayRoot portal -->
</template>
