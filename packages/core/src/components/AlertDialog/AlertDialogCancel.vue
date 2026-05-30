<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogCancelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { inject, useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { PresenceContextKey, PresenceState, resolveBusyState } from '@/components/Presence'
import { useA11y } from '@/shared/composables'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

const props = withDefaults(defineProps<AlertDialogCancelProps>(), {
  as: 'view',
})

const rootContext = injectAlertDialogRootContext()

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'button',
  label: attrs['accessibility-label'] as string | undefined,
}))

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
    v-bind="a11y"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
