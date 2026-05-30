<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

/**
 * Emits kept for API parity with reka-ui's `DialogContentImpl`. All four are
 * inert on Lynx: there is no focus model (`openAutoFocus` / `closeAutoFocus`)
 * and an AlertDialog is never dismissed by an outside tap, so
 * `interactOutside` / `pointerDownOutside` are declared but never fired.
 */
export type AlertDialogContentImplEmits = {
  /** Auto-focus on open. Inert on Lynx — kept so call sites mirror reka-ui. */
  openAutoFocus: [event: any]
  /** Auto-focus on close. Inert on Lynx — kept so call sites mirror reka-ui. */
  closeAutoFocus: [event: any]
}

export interface AlertDialogContentImplProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling transition with Vue native transition or other animation
   * libraries.
   */
  forceMount?: boolean
  /**
   * When `true`, focus cannot escape the `Content`. No-op on Lynx (there is
   * no focus trap); kept for API parity with reka-ui.
   * @defaultValue false
   */
  trapFocus?: boolean
  /**
   * Style applied to the full-screen backdrop wrapper. No defaults — pass
   * `backgroundColor`, alignment, etc. here for the modal dim/centering.
   */
  backdropStyle?: Record<string, any>
}
</script>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { Primitive } from '@/components/Primitive'
import {
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
  resolveAnimationStatus,
} from '@/components/Presence'
import { useForwardExpose, useId } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectAlertDialogRootContext } from './AlertDialogRoot.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<AlertDialogContentImplProps>(), {
  as: 'view',
})
defineEmits<AlertDialogContentImplEmits>()

const rootContext = injectAlertDialogRootContext()
const { forwardRef } = useForwardExpose()

// Modal alert-dialog semantics for the panel: a valid `alertdialog` role (via
// role-description) plus an a11y focus trap so the overlay is announced as a
// self-contained modal.
const a11y = useA11y(() => ({
  role: 'alertdialog',
  exclusiveFocus: true,
}))

rootContext.titleId ||= useId(undefined, 'vy-alert-dialog-title')
rootContext.descriptionId ||= useId(undefined, 'vy-alert-dialog-description')

// `inject` returns null when this component is rendered outside a `<Presence>`
// (e.g. forceMount with no wrapping Presence) — we fall back to a no-op shape
// so the bindings render cleanly.
const presenceCtx = inject(PresenceContextKey, null)

// Drive the `ui-open` / `ui-closed` / `ui-entering` / `ui-leaving` /
// `ui-animating` classes off the Presence state machine. When there is no
// Presence in scope, treat the panel as fully entered so static styles still
// apply.
const stateRef = computed(() =>
  presenceCtx?.controllers.state.value ?? PresenceState.Entered,
)

const status = computed(() =>
  resolveAnimationStatus({
    state: stateRef.value,
    enableDelay: false,
  }),
)

const panelClass = computed(() =>
  presenceClassVariants({
    state: stateRef.value,
    enableDelay: false,
    className: 'vyui-alert-dialog-content',
    transition: true,
  }),
)

const backdropClass = computed(() =>
  presenceClassVariants({
    state: stateRef.value,
    enableDelay: false,
    className: 'vyui-alert-dialog-backdrop',
    transition: true,
  }),
)

// Plain no-op fallbacks so the template can bind unconditionally even when
// `<Presence>` is not in scope (e.g. `forceMount` with no wrapping Presence).
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
  <!--
    Unlike `DialogContentImpl` there is NO `@tap` on the backdrop: an alert
    dialog must not be dismissed by a backdrop tap — the consumer closes it
    through AlertDialogAction / AlertDialogCancel. The backdrop only carries
    the fade-in / fade-out animation hooks so the dim layer animates in step
    with the panel.

    Both views bind the full set of animation / transition events
    (`@animationstart` / `@animationend` / `@animationcancel` /
    `@transitionstart` / `@transitionend` / `@transitioncancel`) so whichever
    the consumer uses, the
    Presence state machine sees a real signal. The 24-frame fallback inside
    `usePresence` covers the no-animation case.
  -->
  <OverlayBackdrop
    :backdrop-style="props.backdropStyle"
    :class="backdropClass"
    :data-state="status.open ? 'open' : 'closed'"
    @animationstart="handleKFStart"
    @animationend="handleKFEnd"
    @animationcancel="handleKFCancel"
    @transitionstart="handleTransitionStart"
    @transitionend="handleTransitionEnd"
    @transitioncancel="handleTransitionCancel"
  >
    <Primitive
      :ref="forwardRef"
      :as="props.as"
      :as-child="props.asChild"
      :class="panelClass"
      :data-state="status.open ? 'open' : 'closed'"
      v-bind="{ ...$attrs, ...a11y }"
      @tap.stop
      @animationstart="handleKFStart"
      @animationend="handleKFEnd"
      @animationcancel="handleKFCancel"
      @transitionstart="handleTransitionStart"
      @transitionend="handleTransitionEnd"
      @transitioncancel="handleTransitionCancel"
    >
      <slot />
    </Primitive>
  </OverlayBackdrop>
</template>

<!--
  Keyframes (`vyui-fade-*`, `vyui-zoom-*`) ship from `Presence/presence.css`
  via the side-effect import in `components/Presence/index.ts`. This block
  only wires the AlertDialog-scoped selectors onto those shared keyframes.
-->
<style scoped>
.vyui-alert-dialog-backdrop.ui-open {
  animation: vyui-fade-in 180ms ease-out forwards;
}
.vyui-alert-dialog-backdrop.ui-closed {
  animation: vyui-fade-out 160ms ease-in forwards;
}
.vyui-alert-dialog-content.ui-open {
  animation: vyui-zoom-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.vyui-alert-dialog-content.ui-closed {
  animation: vyui-zoom-out 160ms ease-in forwards;
}
</style>
