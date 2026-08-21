<script lang="ts">
import type {
  DropdownMenuSubContentImplEmits,
  DropdownMenuSubContentImplProps,
} from './DropdownMenuSubContentImpl.vue'

export type DropdownMenuSubContentEmits = DropdownMenuSubContentImplEmits

export interface DropdownMenuSubContentProps extends DropdownMenuSubContentImplProps {
  /** Force mounting so the content stays registered (e.g. for animations). */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { defineComponent, h, onUnmounted, useAttrs, useSlots } from 'vue'
import { Presence } from '@/components/Presence'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot/overlayStore'
import { captureProvides, useEmitAsProps, useId } from '@/shared'
import DropdownMenuSubContentImpl from './DropdownMenuSubContentImpl.vue'
import { injectDropdownMenuSubContext } from './DropdownMenuSub.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<DropdownMenuSubContentProps>()
const emit = defineEmits<DropdownMenuSubContentEmits>()
const subContext = injectDropdownMenuSubContext()

const id = useId()
const attrs = useAttrs()
const slots = useSlots()
const emitAsProps = useEmitAsProps(emit)
// `provides` is captured so items rendered through the OverlayRoot portal still
// inject DropdownMenuSubContext — DropdownMenuSub is an ancestor of this tree.
const capturedProvides = captureProvides()

// Lynx has no DOM and no `#overlay-root` element to `<Teleport>` into, so
// register with the same `overlayStore` portal as DropdownMenuContent.
const PortalRegistration = defineComponent({
  name: 'DropdownMenuSubContentPortal',
  setup() {
    registerOverlay(id, () => h(
      DropdownMenuSubContentImpl,
      { as: props.as, ...attrs, ...emitAsProps },
      slots,
    ), capturedProvides)
    onUnmounted(() => unregisterOverlay(id))
    return () => null
  },
})
</script>

<template>
  <Presence :show="forceMount || subContext.open.value">
    <PortalRegistration />
  </Presence>
</template>
