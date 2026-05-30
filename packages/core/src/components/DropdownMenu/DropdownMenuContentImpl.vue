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
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { Primitive } from '@/components/Primitive'
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
      :data-state="rootContext.open.value ? 'open' : 'closed'"
      v-bind="{ ...$attrs, ...a11y }"
      @tap="stopTap"
    >
      <slot />
    </Primitive>
  </OverlayBackdrop>
</template>
