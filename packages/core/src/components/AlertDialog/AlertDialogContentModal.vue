<script setup lang="ts">
import type {
  AlertDialogContentImplProps,
} from './AlertDialogContentImpl.vue'
import { getCurrentInstance, h, onUnmounted, useAttrs, useSlots, watch } from 'vue'
import { useForwardExpose, useId } from '@/shared'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot/overlayStore'
import AlertDialogContentImpl from './AlertDialogContentImpl.vue'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<AlertDialogContentImplProps>()

const rootContext = injectAlertDialogRootContext()

const { forwardRef } = useForwardExpose()

// --- Overlay-portal registration -------------------------------------------
// On Lynx there is no `<Teleport>`; an open overlay is registered into the
// `overlayStore` and painted by the single app-root `<OverlayRoot>`. The
// content registers after the overlay backdrop, so it stacks on top of it.
// `<Presence>` in `AlertDialogContent` keeps this mounted across an exit
// animation, so registration is simply tied to this component's lifetime.
const attrs = useAttrs()
const slots = useSlots()
const id = useId()
// Captured once: OverlayRoot's ContextBridge replays this provide chain so
// slot content (AlertDialogAction / AlertDialogCancel / …) injects its root
// context despite painting outside the original component tree.
const capturedProvides = (getCurrentInstance() as
  | { provides?: Record<any, any> }
  | null)?.provides

function render() {
  return h(
    AlertDialogContentImpl,
    {
      ...props,
      ...attrs,
      // AlertDialog is always modal; focus-trap is a no-op on Lynx but kept
      // so the prop threads through exactly as in reka-ui.
      trapFocus: rootContext.open.value,
      ref: forwardRef,
    },
    () => slots.default?.(),
  )
}

// `AlertDialogContent`'s `<Presence>` already gates mounting on `open`, so the
// content is registered for this component's whole lifetime. Re-register when
// props / attrs change so the portal-rendered node stays in sync.
registerOverlay(id, render, capturedProvides)
watch(
  [() => ({ ...props }), () => ({ ...attrs }), () => rootContext.open.value],
  () => registerOverlay(id, render, capturedProvides),
)
onUnmounted(() => unregisterOverlay(id))
</script>

<template>
  <!-- content is painted through the OverlayRoot portal -->
</template>
