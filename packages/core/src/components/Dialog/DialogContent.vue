<script lang="ts">
import type {
  DialogContentImplEmits,
  DialogContentImplProps,
} from './DialogContentImpl.vue'

/** Preventable outside-interaction events — see `useDismissableLayer`. */
export type DialogContentEmits = DialogContentImplEmits

export interface DialogContentProps extends Omit<DialogContentImplProps, 'trapFocus'> {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
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
import DialogContentNonModal from './DialogContentNonModal.vue'
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

// ─────────────────────────────────────────────────────────────────────────
// Presence group — coordinates two child Presence layers (backdrop + panel)
// so the outer `mountView` stays true while either layer is still leaving
// and the dialog only unmounts once both are Left. Mirrors the React port's
// `DialogView` → `usePresenceGroup` shape but with two manually-controlled
// `<Presence>` wrappers because the layers nest (the OverlayBackdrop wraps
// the Primitive) and `usePresenceGroup.renderChildren()` returns siblings.
// ─────────────────────────────────────────────────────────────────────────

const showRef = computed(() => rootContext.open.value)

// Per-layer state slots — fed back through `setPresenceState` props on each
// inner `<Presence>` so the Presence state machine drives them.
const backdropState = ref<PresenceState>(
  showRef.value ? PresenceState.Entering : PresenceState.Left,
)
const panelState = ref<PresenceState>(
  showRef.value ? PresenceState.Entering : PresenceState.Left,
)

// Mirror the combined state up to the root context so DialogTrigger/Close
// can `resolveBusyState` against it without injecting Presence.
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

// `forceMount || mountView || open` — `forceMount` short-circuits the whole
// lifecycle (the consumer is taking over animation), `mountView` keeps the
// dialog painted across the leaving animation, and `open` is the immediate
// truth on the very first paint before the watcher has a chance to fire.
const shouldMount = computed(
  () => !!props.forceMount || mountView.value || showRef.value,
)

</script>

<template>
  <DialogContentModal
    v-if="rootContext.modal.value"
    :ref="forwardRef"
    :present="shouldMount"
    v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
  >
    <slot />
  </DialogContentModal>
  <DialogContentNonModal
    v-else
    :ref="forwardRef"
    :present="shouldMount"
    v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
  >
    <slot />
  </DialogContentNonModal>
</template>
