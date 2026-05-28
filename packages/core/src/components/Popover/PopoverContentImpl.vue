<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { PrimitiveProps } from '@/components/Primitive'

/**
 * Preventable outside-interaction events — see `useDismissableLayer`.
 *
 * reka-ui's `PopoverContentImpl` also emits `openAutoFocus` / `closeAutoFocus`.
 * Those are dropped on Lynx: there is no focus-trap and no programmatic focus
 * model, so `FocusScope` is not rendered and the auto-focus events never fire.
 */
export type PopoverContentImplEmits = DismissableLayerEmits

export interface PopoverContentImplProps extends PrimitiveProps {
  /**
   * Style applied to the full-screen backdrop wrapper. The default
   * `OverlayBackdrop` flex-centers its child; pass alignment + padding here
   * to dock the popover next to its trigger instead. Mirrors the
   * `DialogContentImpl.backdropStyle` escape hatch.
   */
  backdropStyle?: Record<string, any>
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectPopoverRootContext } from './PopoverRoot.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PopoverContentImplProps>(), {
  as: 'view',
})
defineEmits<PopoverContentImplEmits>()

const { forwardRef } = useForwardExpose()
const rootContext = injectPopoverRootContext()

/**
 * A tap inside the content must not bubble to the backdrop view (which
 * dismisses the popover). reka-ui gets this for free from `DismissableLayer`;
 * on Lynx we stop propagation explicitly with `@tap.stop`.
 *
 * Lynx adaptations vs. reka-ui's `PopoverContentImpl`:
 *   - no `FocusScope` / `useFocusGuards` (no focus model on Lynx)
 *   - no `PopperContent` / `@floating-ui` (anchor positioning dropped — the
 *     content is centred by the OverlayRoot portal)
 *   - `accessibility-traits` instead of ARIA `role`/`aria-labelledby`
 */
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="props.asChild"
    accessibility-traits="dialog"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    v-bind="$attrs"
    @tap.stop
  >
    <slot />
  </Primitive>
</template>
