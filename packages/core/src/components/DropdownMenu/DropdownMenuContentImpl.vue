<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuContentImplProps {
  /** @defaultValue 'view' */
  as?: AsTag
  /** Style applied to the full-screen backdrop wrapper. No defaults — pass `backgroundColor`, alignment, etc. for sheet/modal dim and dock position. */
  backdropStyle?: Record<string, any>
}

/** Preventable outside-interaction events — see `useDismissableLayer`. */
export type DropdownMenuContentImplEmits = DismissableLayerEmits
</script>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { Primitive } from '@/components/Primitive'
import {
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
} from '@/components/Presence'
import { useA11y, useDismissableLayer } from '@/shared/composables'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DropdownMenuContentImplProps>(), { as: 'view' })
const emit = defineEmits<DropdownMenuContentImplEmits>()

const rootContext = injectDropdownMenuRootContext()

const a11y = useA11y(() => ({ role: 'menu' }))

const { onInteractOutside } = useDismissableLayer({
  emit,
  onDismiss: () => rootContext.onOpenChange(false),
})

// `DropdownMenuContent` wraps this Impl in `<Presence>` and captures its
// provides through the overlay portal, so `PresenceContextKey` resolves here
// even though we render outside the original tree. Wiring the animation handlers
// + a leave keyframe is what stops the ~400ms `MAX_WAIT_FRAMES` linger on close.
const presence = inject(PresenceContextKey, null)

const presenceState = computed<PresenceState>(() =>
  presence?.controllers.state.value ?? PresenceState.Entered,
)

// `transition: true` opts into the `ui-entering` / `ui-leaving` classes the
// keyframes below hook; `className` carries the stable hook the CSS targets.
const presenceClass = computed(() =>
  presenceClassVariants({
    state: presenceState.value,
    enableDelay: false,
    transition: true,
    className: 'vyui-dropdown-content',
  }),
)

const dataState = computed(() =>
  presenceState.value === PresenceState.Leaving
  || presenceState.value === PresenceState.Left
    ? 'closed'
    : 'open',
)

const handlers = presence?.animationHandlers

/** Swallow taps on the menu surface so they don't reach the backdrop. */
function stopTap(event: any) {
  event?.stopPropagation?.()
}
</script>

<template>
  <!-- full-screen layer: a tap on the empty area dismisses the menu -->
  <OverlayBackdrop
    :backdrop-style="props.backdropStyle"
    @tap="onInteractOutside"
  >
    <Primitive
      :as="as"
      :data-state="dataState"
      :class="presenceClass"
      v-bind="{ ...$attrs, ...a11y }"
      @tap="stopTap"
      @animationstart="handlers?.handleKFStart"
      @animationend="handlers?.handleKFEnd"
      @animationcancel="handlers?.handleKFCancel"
      @transitionstart="handlers?.handleTransitionStart"
      @transitionend="handlers?.handleTransitionEnd"
      @transitioncancel="handlers?.handleTransitionCancel"
    >
      <slot />
    </Primitive>
  </OverlayBackdrop>
</template>

<style>
/* Animation hook only — the menu's surface comes from the kit `ui.content`
   classes via `$attrs`. Just the transform-origin + resting hidden state, so the
   entrance plays from the anchored edge; Presence toggles `ui-entering` /
   `ui-leaving` and `@animationend` advances it. */
.vyui-dropdown-content {
  transform-origin: top center;
  /* Hidden at rest so the freshly-mounted menu doesn't flash before the
     entrance keyframe runs (Presence holds `ui-closed` for a few frames). */
  opacity: 0;
  transform: scale(0.96);
}

.vyui-dropdown-content.ui-open {
  opacity: 1;
  transform: scale(1);
}

.vyui-dropdown-content.ui-entering {
  animation: vyui-dropdown-in 150ms ease-out both;
}

.vyui-dropdown-content.ui-leaving {
  animation: vyui-dropdown-out 120ms ease-in both;
}

@keyframes vyui-dropdown-in {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes vyui-dropdown-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.96) translateY(-4px); }
}
</style>
