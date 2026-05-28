<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { PrimitiveProps } from '@/components/Primitive'

export interface SelectContentProps extends PrimitiveProps {
  /**
   * Style applied to the full-screen backdrop wrapper. No defaults — pass
   * `backgroundColor`, alignment, etc. for sheet/modal dim and dock position.
   */
  backdropStyle?: Record<string, any>
}

/** Preventable outside-interaction events — see `useDismissableLayer`. */
export type SelectContentEmits = DismissableLayerEmits
</script>

<script setup lang="ts">
import { defineComponent, h, watch, onUnmounted, useAttrs, useSlots, withModifiers } from 'vue'
import { captureProvides, useId } from '@/shared'
import { useDismissableLayer } from '@/shared/composables'
import { injectSelectRootContext, provideSelectRootContext } from './SelectRoot.vue'
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot/overlayStore'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SelectContentProps>(), { as: 'view' })
const emit = defineEmits<SelectContentEmits>()
const rootContext = injectSelectRootContext()
const { onInteractOutside } = useDismissableLayer({
  emit,
  onDismiss: () => rootContext.onOpenChange(false),
})
const attrs = useAttrs()
const slots = useSlots()
const id = useId()
const capturedProvides = captureProvides()

// Re-provides SelectRootContext so SelectItems rendered through the overlay
// portal can inject it (slot content executes outside the normal component tree).
const SlotWrapper = defineComponent({
  name: 'SelectSlotWrapper',
  setup() {
    provideSelectRootContext(rootContext)
    return () => slots.default?.()
  },
})

function renderFn() {
  return h(
    OverlayBackdrop,
    {
      // Pure passthrough — consumer owns dim, dock, and alignment.
      backdropStyle: props.backdropStyle,
      onTap: onInteractOutside,
    },
    () => h(
      'view',
      {
        ...attrs,
        onTap: withModifiers(() => {}, ['stop']),
      },
      [h(SlotWrapper)],
    ),
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
