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
// `provides` is captured from this instance so menu items rendered through the
// OverlayRoot portal still inject DropdownMenuRootContext — DropdownMenuRoot is
// an ancestor, so its provided context is already on this chain.
const capturedProvides = captureProvides()

// Registered with the overlay store while present, unregistered when gone. It
// is its own component so `Presence` owns the mount/unmount (and exit anim).
const PortalRegistration = defineComponent({
  name: 'DropdownMenuContentPortal',
  setup() {
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
  <Presence :present="forceMount || rootContext.open.value">
    <PortalRegistration />
  </Presence>
</template>
