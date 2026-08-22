<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxContentProps extends PrimitiveProps {}

/** Preventable outside-interaction events — see `useDismissableLayer`. */
export type ComboboxContentEmits = DismissableLayerEmits
</script>

<script setup lang="ts">
import { defineComponent, h, onUnmounted, useAttrs, useSlots, watch, withModifiers } from 'vue'
import { captureProvides, useId } from '@/shared'
import { useDismissableLayer } from '@/shared/composables'
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot/overlayStore'
import { Primitive } from '@/components/Primitive'
import { injectComboboxRootContext, provideComboboxRootContext } from './ComboboxRoot.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ComboboxContentProps>(), { as: 'view' })
const emit = defineEmits<ComboboxContentEmits>()
const rootContext = injectComboboxRootContext()
const { onInteractOutside } = useDismissableLayer({
  emit,
  onDismiss: () => rootContext.onOpenChange(false),
})
const attrs = useAttrs()
const slots = useSlots()
const id = useId()
const capturedProvides = captureProvides()

// Re-provides ComboboxRootContext so ComboboxItems rendered through the overlay
// portal can inject it (slot content executes outside the normal component tree).
const SlotWrapper = defineComponent({
  name: 'ComboboxSlotWrapper',
  setup() {
    provideComboboxRootContext(rootContext)
    return () => slots.default?.()
  },
})

function renderFn() {
  // `OverlayBackdrop` provides the structural full-screen rectangle required by
  // the portal contract; it carries no visual defaults. Consumers paint the
  // panel via class/style on `<ComboboxContent>` (forwarded through `$attrs`)
  // and may dock/dim by positioning the panel itself.
  return h(
    OverlayBackdrop,
    { onTap: onInteractOutside },
    () => h(
      Primitive,
      {
        as: props.as,
        asChild: props.asChild,
        'data-state': 'open',
        ...attrs,
        'onTap': withModifiers(() => {}, ['stop']),
      },
      () => [h(SlotWrapper)],
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
