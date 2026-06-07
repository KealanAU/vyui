<script setup lang="ts">
import type { PopoverContentImplEmits, PopoverContentImplProps } from './PopoverContentImpl.vue'
import { getCurrentInstance, h, onUnmounted, useAttrs, useSlots, watch } from 'vue'
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot/overlayStore'
import { useForwardExpose, useId } from '@/shared'
import { useDismissableLayer } from '@/shared/composables'
import PopoverContentImpl from './PopoverContentImpl.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

/**
 * Non-modal variant. reka-ui's DOM version differs from the modal one in its
 * focus-outside / pointer-down bookkeeping; on Lynx there is no focus model,
 * so it is structurally identical to `PopoverContentModal` minus the
 * (no-op-on-Lynx) scroll-lock / hide-others. Kept as its own file to mirror
 * reka-ui's layout.
 */

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PopoverContentImplProps>(), {
  as: 'view',
})
const emits = defineEmits<PopoverContentImplEmits>()

const rootContext = injectPopoverRootContext()
useForwardExpose()

// Portal registration (Lynx has no Teleport).
const slots = useSlots()
// Undeclared fall-through attrs (`data-testid`, `:style`, …) must reach the
// rendered `PopoverContentImpl` node — it is the only thing painted.
const attrs = useAttrs()
const id = useId()
// `provides` is an internal instance field, absent from the public type.
const capturedProvides = (getCurrentInstance() as
  | { provides?: Record<any, any> }
  | null)?.provides
const { onInteractOutside } = useDismissableLayer({
  emit: emits,
  onDismiss: () => rootContext.onOpenChange(false),
})

function renderFn() {
  const { backdropStyle, ...implProps } = props
  return h(
    OverlayBackdrop,
    { onTap: onInteractOutside, backdropStyle },
    () => h(PopoverContentImpl, { ...implProps, ...attrs }, () => slots.default?.()),
  )
}

watch(
  () => rootContext.open.value,
  (isOpen) => {
    if (isOpen)
      registerOverlay(id, renderFn, capturedProvides)
    else
      unregisterOverlay(id)
  },
  { immediate: true },
)

onUnmounted(() => unregisterOverlay(id))
</script>

<template><!-- content rendered via OverlayRoot portal --></template>
