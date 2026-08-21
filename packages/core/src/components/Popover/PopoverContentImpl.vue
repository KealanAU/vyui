<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { PrimitiveProps } from '@/components/Primitive'

/**
 * Preventable outside-interaction events — see `useDismissableLayer`.
 *
 * reka-ui's `PopoverContentImpl` also emits `openAutoFocus` / `closeAutoFocus`;
 * those are dropped on Lynx, which has no focus-trap or programmatic focus
 * model, so `FocusScope` is not rendered and they never fire.
 */
export type PopoverContentImplEmits = DismissableLayerEmits

export interface PopoverContentImplProps extends PrimitiveProps {
  /**
   * Style applied to the full-screen backdrop wrapper. The default
   * `OverlayBackdrop` flex-centers its child; pass alignment + padding here to
   * dock the popover next to its trigger instead.
   */
  backdropStyle?: Record<string, any>
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectPopoverRootContext } from './PopoverRoot.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PopoverContentImplProps>(), {
  as: 'view',
})
defineEmits<PopoverContentImplEmits>()

const { forwardRef } = useForwardExpose()
const rootContext = injectPopoverRootContext()

// A valid `dialog` role. `exclusiveFocus` is Lynx's focus containment and
// follows the root's `modal` flag, which defaults to false for popovers.
const a11y = useA11y(() => ({
  role: 'dialog',
  exclusiveFocus: rootContext.modal.value,
}))

/**
 * A tap inside the content must not bubble to the backdrop view (which dismisses
 * the popover): reka-ui gets this from `DismissableLayer`, on Lynx it is an
 * explicit `@tap.stop`.
 *
 * Other Lynx adaptations vs. reka-ui: no `FocusScope` / `useFocusGuards`, no
 * `PopperContent` / `@floating-ui` (the content is centred by the OverlayRoot
 * portal), and native `useA11y` instead of ARIA attributes.
 */
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="props.asChild"
    :class="{ 'ui-open': rootContext.open.value, 'ui-closed': !rootContext.open.value }"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    v-bind="{ ...$attrs, ...a11y }"
    @tap.stop
  >
    <slot />
  </Primitive>
</template>
