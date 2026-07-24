<script lang="ts">
import type {
  AlertDialogContentImplEmits,
  AlertDialogContentImplProps,
} from './AlertDialogContentImpl.vue'

/** Focus lifecycle events (inert on Lynx) — see `AlertDialogContentImpl`. */
export type AlertDialogContentEmits = AlertDialogContentImplEmits

export interface AlertDialogContentProps extends Omit<AlertDialogContentImplProps, 'trapFocus'> {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/components/Presence'
import { useEmitAsProps, useForwardExpose } from '@/shared'
import AlertDialogContentModal from './AlertDialogContentModal.vue'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<AlertDialogContentProps>()
const emits = defineEmits<AlertDialogContentEmits>()

const rootContext = injectAlertDialogRootContext()

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef } = useForwardExpose()
</script>

<template>
  <!--
    An AlertDialog is always modal — reka-ui's `DialogContent` branches between
    `DialogContentModal` / `DialogContentNonModal`, but here only the modal
    variant exists, so there is no `v-if` branch.

    `<Presence>` provides the `PresenceContextKey` to `AlertDialogContentModal`
    and (through the captured-provides bridge) to every node painted in the
    OverlayRoot portal. The state machine inside `Presence` drives off the
    `@animation*` / `@transition*` events the inner content wires up — see
    `AlertDialogContentImpl.vue`.
  -->
  <Presence :show="forceMount || rootContext.open.value">
    <AlertDialogContentModal
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </AlertDialogContentModal>
  </Presence>
</template>
