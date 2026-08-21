<script lang="ts">
import type { AlertDialogContentImplProps } from './AlertDialogContentImpl.vue'

export interface AlertDialogContentProps extends AlertDialogContentImplProps {
  /** Force mounting when more control is needed — e.g. driving animation from a
   *  Vue animation library. */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/components/Presence'
import { useForwardExpose } from '@/shared'
import AlertDialogContentModal from './AlertDialogContentModal.vue'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<AlertDialogContentProps>()

const rootContext = injectAlertDialogRootContext()

const { forwardRef } = useForwardExpose()
</script>

<template>
  <!--
    An AlertDialog is always modal, so unlike reka-ui's `DialogContent` there is
    no modal/non-modal branch. `<Presence>` provides the `PresenceContextKey` to
    `AlertDialogContentModal` and, through the captured-provides bridge, to every
    node painted in the OverlayRoot portal; its state machine drives off the
    `@animation*` / `@transition*` events the inner content wires up.
  -->
  <Presence :show="forceMount || rootContext.open.value">
    <AlertDialogContentModal
      :ref="forwardRef"
      v-bind="{ ...props, ...$attrs }"
    >
      <slot />
    </AlertDialogContentModal>
  </Presence>
</template>
