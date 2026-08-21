<script lang="ts">
import type {
  DialogContentImplEmits,
  DialogContentImplProps,
} from './DialogContentImpl.vue'

/** Preventable outside-interaction events — see `useDismissableLayer`. */
export type DialogContentEmits = DialogContentImplEmits

export interface DialogContentProps extends DialogContentImplProps {
  /** Force mounting when more control is needed — e.g. driving animation from a
   *  Vue animation library. */
  forceMount?: boolean
  /** Verbose lifecycle tracing — forwarded to both backdrop + panel Presence. */
  debugLog?: boolean
}
</script>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { PresenceState, combineGroupState } from '@/components/Presence'
import { useEmitAsProps, useForwardExpose } from '@/shared'
import DialogContentModal from './DialogContentModal.vue'
import { injectDialogRootContext } from './DialogRoot.vue'
import {
  DialogContentPresenceKey,
  type DialogContentPresenceContext,
} from './dialogContentContext'

defineOptions({ inheritAttrs: false })

const props = defineProps<DialogContentProps>()
const emits = defineEmits<DialogContentEmits>()

const rootContext = injectDialogRootContext()

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef } = useForwardExpose()

// Presence group — coordinates the backdrop + panel layers so the outer
// `mountView` stays true while either is still leaving and the dialog only
// unmounts once both are Left. Mirrors the React port's `usePresenceGroup` shape
// but with two manually-controlled `<Presence>` wrappers, because the layers
// nest and `renderChildren()` returns siblings.

const showRef = computed(() => rootContext.open.value)

// Per-layer state slots, fed back through `setPresenceState` on each inner
// `<Presence>`.
const backdropState = ref<PresenceState>(
  showRef.value ? PresenceState.Entering : PresenceState.Left,
)
const panelState = ref<PresenceState>(
  showRef.value ? PresenceState.Entering : PresenceState.Left,
)

// Mirror the combined state up to the root context so DialogTrigger/Close can
// `resolveBusyState` without injecting Presence.
watch(
  [backdropState, panelState],
  ([a, b]) => {
    rootContext.setGroupState(combineGroupState([a, b]))
  },
  { immediate: true },
)

// `mountView` stays true while either layer is mounted (re-armed when `show`
// flips back to true, and torn down only after both layers reach Left).
const mountView = ref<boolean>(showRef.value)
watch(showRef, (next) => {
  if (next) mountView.value = true
})
watch([backdropState, panelState], ([a, b]) => {
  if (
    !showRef.value
    && a === PresenceState.Left
    && b === PresenceState.Left
  ) {
    mountView.value = false
  }
})

const presenceCtx: DialogContentPresenceContext = {
  backdropState,
  panelState,
  setBackdropState: (s) => {
    backdropState.value = s
  },
  setPanelState: (s) => {
    panelState.value = s
  },
  show: showRef,
  debugLog: props.debugLog,
}
provide(DialogContentPresenceKey, presenceCtx)

// `forceMount` short-circuits the lifecycle (the consumer owns animation),
// `mountView` keeps the dialog painted across the leaving animation, and `open`
// is the immediate truth on the first paint before the watcher fires.
const shouldMount = computed(
  () => !!props.forceMount || mountView.value || showRef.value,
)

</script>

<template>
  <DialogContentModal
    :ref="forwardRef"
    :present="shouldMount"
    v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
  >
    <slot />
  </DialogContentModal>
</template>
