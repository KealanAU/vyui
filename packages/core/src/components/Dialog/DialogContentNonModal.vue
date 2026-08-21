<script setup lang="ts">
import type { DialogContentImplEmits, DialogContentImplProps } from './DialogContentImpl.vue'
import { getCurrentInstance, h, onUnmounted, useAttrs, useSlots, watch } from 'vue'
import { useEmitAsProps, useForwardExpose, useId } from '@/shared'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot'
import DialogContentImpl from './DialogContentImpl.vue'

defineOptions({ inheritAttrs: false })

/** `present` is supplied by `DialogContent`'s `<Presence>` — it stays true
 *  while the dialog is animating out, keeping the overlay registered. */
const props = defineProps<DialogContentImplProps & { present?: boolean }>()
const emits = defineEmits<DialogContentImplEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()

// --- Overlay-portal registration -------------------------------------------
// Identical plumbing to `DialogContentModal`. reka-ui's non-modal variant also
// adds trigger-focus / interact-outside bookkeeping; that depends on a DOM
// focus model Lynx does not have, so it is intentionally omitted here.
const attrs = useAttrs()
const slots = useSlots()
const id = useId()
const capturedProvides = (getCurrentInstance() as
  | { provides?: Record<any, any> }
  | null)?.provides

function render() {
  const { present: _present, ...implProps } = props
  return h(
    DialogContentImpl,
    {
      ...implProps,
      ...emitsAsProps,
      ...attrs,
    },
    () => slots.default?.(),
  )
}

watch(
  () => props.present,
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
  <!-- content is painted through the OverlayRoot portal -->
</template>
