<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { PrimitiveProps } from '@/components/Primitive'

// reka-ui's `DialogContentImpl` also emits `openAutoFocus` / `closeAutoFocus`.
// Those are dropped on Lynx: there is no focus-trap and no programmatic focus
// model, so they never fire (same call PopoverContentImpl makes).
export type DialogContentImplEmits = DismissableLayerEmits

export interface DialogContentImplProps extends PrimitiveProps {
  /** Force mounting when more control is needed — e.g. driving the transition
   *  from a Vue native transition or another animation library. */
  forceMount?: boolean
  /**
   * Style applied to the full-screen backdrop wrapper. No defaults — pass
   * `backgroundColor`, alignment, etc. here for the modal dim/centering.
   */
  backdropStyle?: Record<string, any>
  /**
   * Class merged onto the full-screen backdrop wrapper (the `OverlayBackdrop`
   * that centers the panel). Core ships no dim or animation of its own; the
   * element carries the Presence lifecycle classes and `bindanimation*` hooks,
   * so the styled layer's keyframes drive the lifecycle just like the panel's.
   */
  backdropClass?: string
  /**
   * Opt the backdrop / panel into the animating-state classes (`ui-entering` /
   * `ui-leaving` / `ui-animating` alongside `ui-open` / `ui-closed`). Off for
   * callers that don't style transitions. @defaultValue true
   */
  transition?: boolean
}
</script>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, h, inject, mergeProps } from 'vue'
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { Primitive, type AsTag } from '@/components/Primitive'
import {
  Presence,
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
} from '@/components/Presence'
import { useForwardExpose, useId } from '@/shared'
import { useA11y, useDismissableLayer } from '@/shared/composables'
import {
  DialogContentPresenceKey,
  type DialogContentPresenceContext,
} from './dialogContentContext'
import { injectDialogRootContext } from './DialogRoot.vue'

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

// reka-ui's `DismissableLayer` listens for outside pointer events; on Lynx the
// equivalent is a `tap` on the full-screen backdrop `<view>`, surfacing the
// preventable `interactOutside` / `pointerDownOutside` events. A tap on the
// inner content node is stopped so it never reaches the backdrop.
const { onInteractOutside } = useDismissableLayer({
  emit: emits,
  onDismiss: () => rootContext.onOpenChange(false),
})

// A valid `dialog` role (via role-description). `exclusiveFocus` is Lynx's
// focus containment — the only real modality lever here — so it follows the
// root's `modal` flag: a non-modal dialog leaves siblings reachable.
const a11y = useA11y(() => ({
  role: 'dialog',
  exclusiveFocus: rootContext.modal.value,
}))

// DialogContent owns the per-layer Presence state and provides it through
// `DialogContentPresenceKey`. Painted through the OverlayRoot portal, the
// captured-provides bridge re-applies that provide on this side. When the bridge
// is absent (tests mounting the impl directly), fall back to a no-op shape that
// defaults both layers to Left.
const ctxFallback: DialogContentPresenceContext = {
  backdropState: { value: PresenceState.Left } as any,
  panelState: { value: PresenceState.Left } as any,
  setBackdropState: () => {},
  setPanelState: () => {},
  show: { value: false } as any,
  debugLog: false,
}
const contentCtx = inject(DialogContentPresenceKey, ctxFallback)

// `BackdropLayer` consumes its closest `<Presence>` (the backdrop one) for the
// OverlayBackdrop's root `<view>`. Attrs flow through OverlayBackdrop's
// `inheritAttrs: true`, so `bindanimation*` lands where Lynx expects.
const BackdropLayer = defineComponent({
  name: 'DialogBackdropLayer',
  props: {
    backdropStyle: { type: Object, default: () => ({}) },
    backdropClass: { type: String, default: '' },
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
        'class': [className.value, p.backdropClass],
        'data-state': dataState.value,
        'onTap': () => emit('tap'),
        // Lynx animation/transition lifecycle bindings — without these the
        // Presence state machine never advances past Entering/Leaving on real
        // Lynx. The kebab-cased attr names match what Lynx emits.
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

// `PanelLayer` does the same for the inner `<Primitive>`. Inject is local so it
// picks up the inner `<Presence>`, not the outer backdrop one.
const PanelLayer = defineComponent({
  name: 'DialogPanelLayer',
  inheritAttrs: false,
  props: {
    as: {
      // Accept the full `AsTag | Component` union so callers can pass a
      // component without TypeScript narrowing down to `string`.
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
    // `mergeProps` (not object spread) so the inbound `$attrs` class is
    // CONCATENATED with the Presence lifecycle classes: letting `attrs.class`
    // clobber `ui-open` / `ui-entering` leaves the panel stuck at its
    // `opacity: 0` base and the dialog opens invisible.
    return () => h(
      Primitive,
      mergeProps(
        attrs,
        {
          'as': p.as,
          'asChild': p.asChild,
          'data-state': p.dataState,
          'class': className.value,
          'bindanimationstart': handlers?.handleKFStart,
          'bindanimationend': handlers?.handleKFEnd,
          'bindanimationcancel': handlers?.handleKFCancel,
          'bindtransitionstart': handlers?.handleTransitionStart,
          'bindtransitionend': handlers?.handleTransitionEnd,
          'bindtransitioncancel': handlers?.handleTransitionCancel,
          ...a11y.value,
          // tap.stop is wired on Primitive's root via the Vue event-modifier
          // shim; emulate it with a handler that doesn't bubble. The panel is
          // deliberately inert so a tap on it doesn't dismiss.
          'onTap': (e: any) => e?.stopPropagation?.(),
        },
      ),
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
      :backdrop-class="props.backdropClass"
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
  Headless: core ships no animation of its own. `vyui-dialog-backdrop` /
  `vyui-dialog-content` are stable hook classes carrying `data-state`, the
  lifecycle classes and the `bindanimation*` bindings; `@vyui/kit` supplies the
  keyframes. With no keyframes the panel simply mounts/unmounts — Presence's
  24-frame fallback covers it.
-->
