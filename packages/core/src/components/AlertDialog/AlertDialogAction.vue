<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogActionProps extends PrimitiveProps {}

export type AlertDialogActionEmits = {
  /** Event handler called when the action button is tapped. */
  click: []
}
</script>

<script setup lang="ts">
import { inject, useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { PresenceContextKey, PresenceState, resolveBusyState } from '@/components/Presence'
import { useA11y } from '@/shared/composables'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

const props = withDefaults(defineProps<AlertDialogActionProps>(), {
  as: 'view',
})

const emit = defineEmits<AlertDialogActionEmits>()

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'button',
  label: attrs['accessibility-label'] as string | undefined,
}))

const rootContext = injectAlertDialogRootContext()

// Painted Actions live inside the OverlayRoot portal — the captured-provides
// bridge replays the `<Presence>` provide chain here, so `inject` resolves
// the same Presence context as the panel `<view>`. `resolveBusyState` returns
// true while the state machine is mid-animation; we swallow taps in that
// window so the user can't re-trigger close while the leaving animation is
// running.
const presenceCtx = inject(PresenceContextKey, null)

function handleTap() {
  const state = presenceCtx?.controllers.state.value ?? PresenceState.Entered
  if (resolveBusyState(state)) return
  emit('click')
  rootContext.onOpenChange(false)
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    v-bind="a11y"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
