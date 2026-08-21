<script lang="ts">
import type { AlertDialogOverlayImplProps } from './AlertDialogOverlayImpl.vue'

export interface AlertDialogOverlayProps extends AlertDialogOverlayImplProps {
  /** Force mounting when more control is needed — e.g. driving animation from a
   *  Vue animation library. */
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
// The backdrop paints through the same `overlayStore` portal as
// `AlertDialogContent` and registers before the content mounts, so it sits
// underneath the panel.
//
// The lifetime of `<Presence>`'s slot child is the source of truth for whether
// the overlay is painted: a tiny `Registrant` rendered inside the default slot
// calls `registerOverlay` / `unregisterOverlay` from its own mount hooks, and
// Presence keeps it alive through the leaving animation.
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

// Intentionally inert: the Registrant child owns register / unregister, and the
// `render` closure is re-created each render, so the next `registerOverlay` call
// already picks up the latest props. Kept as a watch so the dependency list
// documents what the painted node tracks.
watch(
  [
    () => ({ ...props }),
    () => ({ ...attrs }),
    () => rootContext.open.value,
  ],
  () => {},
)

onUnmounted(() => unregisterOverlay(id))

// Inline registrant component — purely a side-effect container, so Presence can
// drive register / unregister off its mount lifecycle.
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
