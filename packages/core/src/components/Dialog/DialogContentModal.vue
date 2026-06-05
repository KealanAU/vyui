<script setup lang="ts">
import type { DialogContentImplEmits, DialogContentImplProps } from './DialogContentImpl.vue'
import { getCurrentInstance, h, onUnmounted, useAttrs, useSlots, watch } from 'vue'
import { useEmitAsProps, useForwardExpose, useId } from '@/shared'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot'
import DialogContentImpl from './DialogContentImpl.vue'
import { injectDialogRootContext } from './DialogRoot.vue'

defineOptions({ inheritAttrs: false })

/** `present` is supplied by `DialogContent`'s `<Presence>` — it stays true
 *  while the dialog is animating out, keeping the overlay registered. */
const props = defineProps<DialogContentImplProps & { present?: boolean }>()
const emits = defineEmits<DialogContentImplEmits>()

const rootContext = injectDialogRootContext()
const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()

// --- Overlay-portal registration -------------------------------------------
// Lynx has no `<Teleport>`: an open dialog is registered into `overlayStore`
// and painted by the app-root `<OverlayRoot>`. We capture this component's
// `provides` chain so slot content (DialogClose, …) still injects correctly,
// and register / unregister a render fn as the `present` prop (driven by
// `DialogContent`'s `<Presence>`) flips.
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
      // Modal: focus would be trapped on the DOM; no-op on Lynx but kept for
      // API parity. The screen behind is dimmed via `backdropClass` on the
      // Presence-wired backdrop (so the dim fades with the panel).
      trapFocus: rootContext.open.value,
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
