<script lang="ts">
import type { AlertDialogOverlayImplProps } from './AlertDialogOverlayImpl.vue'

export interface AlertDialogOverlayProps extends AlertDialogOverlayImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import {
  defineComponent,
  getCurrentInstance,
  h,
  onMounted,
  onUnmounted,
  useAttrs,
  useSlots,
  watch,
} from 'vue'
import { useForwardExpose, useId } from '@/shared'
import { Presence } from '@/components/Presence'
import {
  registerOverlay,
  unregisterOverlay,
} from '@/components/OverlayRoot/overlayStore'
import AlertDialogOverlayImpl from './AlertDialogOverlayImpl.vue'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<AlertDialogOverlayProps>()

const rootContext = injectAlertDialogRootContext()
useForwardExpose()

// --- Overlay-portal registration -------------------------------------------
// The overlay backdrop paints through the same `overlayStore` portal as
// `AlertDialogContent`, so it stacks correctly behind the content. It
// registers before the content mounts so it sits underneath the panel.
//
// Phase-2: the lifetime of `<Presence>`'s slot child is the source of truth
// for whether the overlay is painted. We render a tiny `Registrant` inside
// the Presence default slot; its `onMounted` / `onUnmounted` are what call
// `registerOverlay` / `unregisterOverlay`. Presence keeps the slot child
// alive through the leaving animation (the state machine waits for
// `bindanimation*` / `bindtransition*` to fire or for the 24-frame fallback)
// so the painted backdrop stays on-screen for the exit animation.
const attrs = useAttrs()
const slots = useSlots()
const id = useId()
const capturedProvides = (getCurrentInstance() as
  | { provides?: Record<any, any> }
  | null)?.provides

function render() {
  return h(
    AlertDialogOverlayImpl,
    { as: props.as, asChild: props.asChild, ...attrs },
    () => slots.default?.(),
  )
}

// Keep the painted node in sync when the consumer mutates `props` / `attrs`
// while the overlay is mounted. We don't toggle the registration here — the
// Registrant child below owns that — we just re-push the latest render fn
// when something the painted node depends on changes.
watch(
  [
    () => ({ ...props }),
    () => ({ ...attrs }),
    () => rootContext.open.value,
  ],
  () => {
    // No-op: register on mount via Registrant covers the painted lifetime.
    // (The `render` closure is re-created on every render of this component
    // so the next `registerOverlay` call from the Registrant will already
    // pick up the latest props.)
  },
)

onUnmounted(() => unregisterOverlay(id))

// Inline registrant component — purely a side-effect container. Rendering it
// inside `<Presence>` lets Presence drive register / unregister off its own
// mount lifecycle.
const Registrant = defineComponent({
  name: 'AlertDialogOverlayRegistrant',
  setup() {
    onMounted(() => {
      registerOverlay(id, render, capturedProvides)
    })
    onUnmounted(() => {
      unregisterOverlay(id)
    })
    return () => null
  },
})
</script>

<template>
  <Presence :show="forceMount || rootContext.open.value">
    <Registrant />
  </Presence>
</template>
