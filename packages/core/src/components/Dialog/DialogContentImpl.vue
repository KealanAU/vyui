<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { PrimitiveProps } from '@/components/Primitive'

export type DialogContentImplEmits = DismissableLayerEmits & {
  /**
   * Event handler called when auto-focusing on open. Can be prevented.
   * Inert on Lynx (no focus model) — kept so call sites mirror reka-ui.
   */
  openAutoFocus: [event: any]
  /**
   * Event handler called when auto-focusing on close. Can be prevented.
   * Inert on Lynx (no focus model) — kept so call sites mirror reka-ui.
   */
  closeAutoFocus: [event: any]
}

export interface DialogContentImplProps extends PrimitiveProps {
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
  /**
   * Opt the backdrop / panel into the animating-state classes
   * (`ui-entering` / `ui-leaving` / `ui-animating` alongside the static
   * `ui-open` / `ui-closed` pair). Off by default so callers that don't
   * style transitions don't get extra classes; on for any caller wiring up
   * `vyui-fade-*` / `vyui-zoom-*` keyframes.
   * @defaultValue true
   */
  transition?: boolean
}
</script>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, h, inject } from 'vue'
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { Primitive, type AsTag } from '@/components/Primitive'
import {
  Presence,
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
} from '@/components/Presence'
import { useForwardExpose, useId } from '@/shared'
import { useDismissableLayer } from '@/shared/composables'
import {
  DialogContentPresenceKey,
  type DialogContentPresenceContext,
} from './dialogContentContext'
import { injectDialogRootContext } from './DialogRoot.vue'
import { useWarning } from './utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DialogContentImplProps>(), {
  as: 'view',
  transition: true,
})
const emits = defineEmits<DialogContentImplEmits>()

const rootContext = injectDialogRootContext()
const { forwardRef } = useForwardExpose()

rootContext.titleId ||= useId(undefined, 'vy-dialog-title')
rootContext.descriptionId ||= useId(undefined, 'vy-dialog-description')

// Dev-only accessibility warning — no-op on Lynx (see `utils.ts`).
if (__DEV__) {
  useWarning({
    titleName: 'DialogTitle',
    contentName: 'DialogContent',
    componentLink: 'dialog.html#title',
    titleId: rootContext.titleId,
    descriptionId: rootContext.descriptionId,
    contentElement: rootContext.contentElement,
  })
}

// reka-ui's `DismissableLayer` listens for outside pointer events; on Lynx the
// equivalent is a `tap` on the full-screen backdrop `<view>`. The tap surfaces
// the preventable `interactOutside` / `pointerDownOutside` events — left
// un-prevented they close the dialog. A tap on the inner content node is
// stopped so it never reaches the backdrop.
const { onInteractOutside } = useDismissableLayer({
  emit: emits,
  onDismiss: () => rootContext.onOpenChange(false),
})

// ─────────────────────────────────────────────────────────────────────────
// DialogContent owns the per-layer Presence state and provides it through
// `DialogContentPresenceKey`. Painted through the OverlayRoot portal, the
// captured-provides bridge re-applies that provide on this side so we can
// inject it here too. When the bridge is absent (e.g. tests that mount the
// impl directly), fall back to a no-op shape that defaults both layers to
// Left — keeps the structure renderable without crashing on missing inject.
// ─────────────────────────────────────────────────────────────────────────
const ctxFallback: DialogContentPresenceContext = {
  backdropState: { value: PresenceState.Left } as any,
  panelState: { value: PresenceState.Left } as any,
  setBackdropState: () => {},
  setPanelState: () => {},
  show: { value: false } as any,
  debugLog: false,
}
const contentCtx = inject(DialogContentPresenceKey, ctxFallback)

// `BackdropLayer` consumes its closest `<Presence>` (the backdrop one) so we
// can read the animation handlers + state for the OverlayBackdrop's root
// `<view>`. Attrs flow through OverlayBackdrop's `inheritAttrs: true` to the
// painted `<view>`, so `bindanimation*` lands where Lynx expects.
const BackdropLayer = defineComponent({
  name: 'DialogBackdropLayer',
  props: {
    backdropStyle: { type: Object, default: () => ({}) },
  },
  emits: ['tap'],
  setup(p, { slots, emit }) {
    const presence = inject(PresenceContextKey, null)
    const state = presence?.controllers.state
    const handlers = presence?.animationHandlers
    const className = computed(() => presenceClassVariants({
      state: state?.value ?? PresenceState.Left,
      enableDelay: false,
      className: 'vyui-dialog-backdrop',
      transition: props.transition,
    }))
    const dataState = computed(() => (
      state && (state.value === PresenceState.Entering
        || state.value === PresenceState.DelayedEntering
        || state.value === PresenceState.Entered)
        ? 'open'
        : 'closed'
    ))
    return () => h(
      OverlayBackdrop,
      {
        'backdropStyle': p.backdropStyle,
        'class': className.value,
        'data-state': dataState.value,
        'onTap': () => emit('tap'),
        // Lynx animation/transition lifecycle bindings — without these the
        // Presence state machine never advances past Entering/Leaving on
        // real Lynx, the entire point of the Phase-2 port. The kebab-cased
        // attr names match what Lynx emits in production; we forward the
        // event payload along even though the state machine only cares
        // about which phase ended.
        'bindanimationstart': handlers?.handleKFStart,
        'bindanimationend': handlers?.handleKFEnd,
        'bindanimationcancel': handlers?.handleKFCancel,
        'bindtransitionstart': handlers?.handleTransitionStart,
        'bindtransitionend': handlers?.handleTransitionEnd,
        'bindtransitioncancel': handlers?.handleTransitionCancel,
      },
      { default: () => slots.default?.() },
    )
  },
})

// `PanelLayer` does the same for the inner `<Primitive>` (the modal panel
// that zooms in/out). Inject is local so it picks up the inner `<Presence>`,
// not the outer backdrop one.
const PanelLayer = defineComponent({
  name: 'DialogPanelLayer',
  inheritAttrs: false,
  props: {
    as: {
      // Accept the full `AsTag | Component` union so callers can pass a
      // component (e.g. an as-child wrapper) without TypeScript narrowing
      // down to `string` and losing the option.
      type: [String, Object, Function] as PropType<AsTag | object>,
      default: 'view',
    },
    asChild: { type: Boolean, default: false },
    dataState: { type: String, default: 'closed' },
  },
  setup(p, { slots, attrs }) {
    const presence = inject(PresenceContextKey, null)
    const state = presence?.controllers.state
    const handlers = presence?.animationHandlers
    const className = computed(() => presenceClassVariants({
      state: state?.value ?? PresenceState.Left,
      enableDelay: false,
      className: 'vyui-dialog-content',
      transition: props.transition,
    }))
    return () => h(
      Primitive,
      {
        'as': p.as,
        'asChild': p.asChild,
        'accessibility-traits': 'dialog',
        'data-state': p.dataState,
        'class': className.value,
        'bindanimationstart': handlers?.handleKFStart,
        'bindanimationend': handlers?.handleKFEnd,
        'bindanimationcancel': handlers?.handleKFCancel,
        'bindtransitionstart': handlers?.handleTransitionStart,
        'bindtransitionend': handlers?.handleTransitionEnd,
        'bindtransitioncancel': handlers?.handleTransitionCancel,
        ...attrs,
        // tap.stop is wired on Primitive's root via the Vue event-modifier
        // shim; emulate it here by attaching an explicit handler that
        // doesn't bubble. The DismissableLayer's tap is on OverlayBackdrop;
        // we deliberately leave the panel inert so a tap on it doesn't
        // dismiss.
        'onTap': (e: any) => e?.stopPropagation?.(),
      },
      { default: () => slots.default?.() },
    )
  },
})
</script>

<template>
  <Presence
    :state="contentCtx.backdropState.value"
    :set-presence-state="contentCtx.setBackdropState"
    :show="contentCtx.show.value"
    :force-mount="props.forceMount"
    :debug-log="contentCtx.debugLog"
  >
    <BackdropLayer
      :backdrop-style="props.backdropStyle"
      @tap="onInteractOutside"
    >
      <Presence
        :state="contentCtx.panelState.value"
        :set-presence-state="contentCtx.setPanelState"
        :show="contentCtx.show.value"
        :force-mount="props.forceMount"
        :debug-log="contentCtx.debugLog"
      >
        <PanelLayer
          :ref="forwardRef"
          :as="props.as"
          :as-child="props.asChild"
          :data-state="rootContext.open.value ? 'open' : 'closed'"
          v-bind="$attrs"
        >
          <slot />
        </PanelLayer>
      </Presence>
    </BackdropLayer>
  </Presence>
</template>

<!--
  Backdrop fade + panel zoom — the `vyui-fade-*` / `vyui-zoom-*` keyframes
  themselves ship from `components/Presence/presence.css` (side-effect
  imported via `components/Presence/index.ts`) so they're shared across
  Dialog / AlertDialog / Sheet. This block just wires the per-class
  selectors that fire the `ui-entering` / `ui-leaving` animations on the
  Dialog-specific classes (`vyui-dialog-backdrop` / `vyui-dialog-content`).

  Enter: 250ms, `cubic-bezier(0.16, 1, 0.3, 1)` (decel out).
  Exit:  200ms, `cubic-bezier(0.5, 0, 0.75, 0)` (accel in).
-->
<style scoped>
.vyui-dialog-backdrop.ui-entering {
  animation: vyui-fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.vyui-dialog-backdrop.ui-leaving {
  animation: vyui-fade-out 200ms cubic-bezier(0.5, 0, 0.75, 0) both;
}
.vyui-dialog-content.ui-entering {
  animation: vyui-zoom-in 250ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.vyui-dialog-content.ui-leaving {
  animation: vyui-zoom-out 200ms cubic-bezier(0.5, 0, 0.75, 0) both;
}
</style>
