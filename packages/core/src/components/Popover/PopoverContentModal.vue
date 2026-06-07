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
 * Modal variant. On the DOM reka-ui would scroll-lock the body
 * (`useBodyScrollLock`) and hide siblings from assistive tech
 * (`useHideOthers`); both are no-ops on Lynx, so this differs from the
 * non-modal variant only in intent — it is kept as a separate file to mirror
 * reka-ui's structure and to host modal-specific behaviour if Lynx gains it.
 */

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PopoverContentImplProps>(), {
  as: 'view',
})
const emits = defineEmits<PopoverContentImplEmits>()

const rootContext = injectPopoverRootContext()
useForwardExpose()

// Portal registration (Lynx has no Teleport).
// The provides chain is captured once and replayed by OverlayRoot's
// ContextBridge so slot content (PopoverClose, …) injects normally even though
// it paints outside this component's tree.
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
  // `backdropStyle` belongs to the `OverlayBackdrop` wrapper (alignment /
  // padding for trigger-anchored docking), not to the content primitive
  // itself — strip it out before forwarding props onward.
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
