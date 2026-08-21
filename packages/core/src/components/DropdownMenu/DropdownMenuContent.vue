<script lang="ts">
import type {
  DropdownMenuContentImplEmits,
  DropdownMenuContentImplProps,
} from './DropdownMenuContentImpl.vue'

export type DropdownMenuContentEmits = DropdownMenuContentImplEmits

export interface DropdownMenuContentProps extends DropdownMenuContentImplProps {
  /** Force mounting so the content stays registered (e.g. for animations). */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { defineComponent, h, onUnmounted, useAttrs, useSlots } from 'vue'
import { Presence } from '@/components/Presence'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot/overlayStore'
import { captureProvides, useEmitAsProps, useId } from '@/shared'
import DropdownMenuContentImpl from './DropdownMenuContentImpl.vue'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<DropdownMenuContentProps>()
const emit = defineEmits<DropdownMenuContentEmits>()
const rootContext = injectDropdownMenuRootContext()

const id = useId()
const attrs = useAttrs()
const slots = useSlots()
const emitAsProps = useEmitAsProps(emit)

// Registered with the overlay store while present, unregistered when gone. It
// is its own component so `Presence` owns the mount/unmount (and exit anim).
const PortalRegistration = defineComponent({
  name: 'DropdownMenuContentPortal',
  setup() {
    // Capture provides HERE — inside the `<Presence>` subtree — so the
    // portaled Impl injects BOTH `DropdownMenuRootContext` (from the ancestor
    // Root) AND `PresenceContextKey` (provided by the `<Presence>` parent).
    // The latter is what lets the Impl wire enter/leave animation handlers;
    // capturing in the outer setup (above Presence) misses that key.
    const capturedProvides = captureProvides()
    registerOverlay(id, () => h(
      DropdownMenuContentImpl,
      {
        as: props.as,
        // `backdropStyle` is declared on `DropdownMenuContentImplProps`, so
        // Vue strips it from `$attrs`. Forward it explicitly so trigger-
        // anchored wrappers (VyDropdownMenu) can dock the menu to its trigger.
        backdropStyle: props.backdropStyle,
        ...attrs,
        ...emitAsProps,
      },
      slots,
    ), capturedProvides)
    onUnmounted(() => unregisterOverlay(id))
    return () => null
  },
})
</script>

<template>
  <Presence :show="forceMount || rootContext.open.value">
    <PortalRegistration />
  </Presence>
</template>
