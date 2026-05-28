<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { Primitive } from '@/components/Primitive'
import {
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
  resolveAnimationStatus,
} from '@/components/Presence'
import { useForwardExpose } from '@/shared'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<AlertDialogOverlayImplProps>(), {
  as: 'view',
})

const { forwardRef } = useForwardExpose()

// reka-ui calls `useBodyScrollLock(true)` here; there is no document body to
// lock on Lynx, so scroll-lock is intentionally omitted. There is also NO
// `@tap` handler — an alert dialog is never dismissed by a backdrop tap.
// No visual defaults (color / fill rect) — the caller owns presentation.
//
// Phase-2: `inject(PresenceContextKey)` lets the overlay backdrop participate
// in the same state machine `AlertDialogOverlay` drives via `<Presence>`. The
// resolved status feeds the `ui-*` class string and `data-state` attribute,
// and the animation handlers wire to the root `<view>`'s native event slots.
const presenceCtx = inject(PresenceContextKey, null)

const stateRef = computed(() =>
  presenceCtx?.controllers.state.value ?? PresenceState.Entered,
)
const status = computed(() =>
  resolveAnimationStatus({ state: stateRef.value, enableDelay: false }),
)
const overlayClass = computed(() =>
  presenceClassVariants({
    state: stateRef.value,
    enableDelay: false,
    className: 'vyui-alert-dialog-overlay',
    transition: true,
  }),
)

const noop = () => {}
const handleKFStart = presenceCtx?.animationHandlers.handleKFStart ?? noop
const handleKFEnd = presenceCtx?.animationHandlers.handleKFEnd ?? noop
const handleKFCancel = presenceCtx?.animationHandlers.handleKFCancel ?? noop
const handleTransitionStart
  = presenceCtx?.animationHandlers.handleTransitionStart ?? noop
const handleTransitionEnd
  = presenceCtx?.animationHandlers.handleTransitionEnd ?? noop
const handleTransitionCancel
  = presenceCtx?.animationHandlers.handleTransitionCancel ?? noop
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    :class="overlayClass"
    :data-state="status.open ? 'open' : 'closed'"
    v-bind="$attrs"
    @animationstart="handleKFStart"
    @animationend="handleKFEnd"
    @animationcancel="handleKFCancel"
    @transitionstart="handleTransitionStart"
    @transitionend="handleTransitionEnd"
    @transitioncancel="handleTransitionCancel"
  >
    <slot />
  </Primitive>
</template>

<!--
  `vyui-fade-*` keyframes ship from `Presence/presence.css`.
-->
<style scoped>
.vyui-alert-dialog-overlay.ui-open {
  animation: vyui-fade-in 180ms ease-out forwards;
}
.vyui-alert-dialog-overlay.ui-closed {
  animation: vyui-fade-out 160ms ease-in forwards;
}
</style>
