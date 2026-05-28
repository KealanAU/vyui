<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogCancelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { inject } from 'vue'
import { Primitive } from '@/components/Primitive'
import { PresenceContextKey, PresenceState, resolveBusyState } from '@/components/Presence'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

const props = withDefaults(defineProps<AlertDialogCancelProps>(), {
  as: 'view',
})

const rootContext = injectAlertDialogRootContext()

// See `AlertDialogAction.vue` — same busy-gate so taps during entering /
// leaving don't double-trigger close.
const presenceCtx = inject(PresenceContextKey, null)

function handleTap() {
  const state = presenceCtx?.controllers.state.value ?? PresenceState.Entered
  if (resolveBusyState(state)) return
  rootContext.onOpenChange(false)
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    accessibility-traits="button"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
