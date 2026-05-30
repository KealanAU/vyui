<script lang="ts">
import type { DismissableLayerEmits } from '@/shared/composables'
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuSubContentImplProps {
  /** @defaultValue 'view' */
  as?: AsTag
  /** Style applied to the full-screen backdrop wrapper. No defaults — pass `backgroundColor`, alignment, etc. for sheet/modal dim and dock position. */
  backdropStyle?: Record<string, any>
}

/** Preventable outside-interaction events — see `useDismissableLayer`. */
export type DropdownMenuSubContentImplEmits = DismissableLayerEmits
</script>

<script setup lang="ts">
import { OverlayBackdrop } from '@/components/OverlayRoot'
import { Primitive } from '@/components/Primitive'
import { useA11y, useDismissableLayer } from '@/shared/composables'
import { injectDropdownMenuSubContext } from './DropdownMenuSub.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DropdownMenuSubContentImplProps>(), { as: 'view' })
const emit = defineEmits<DropdownMenuSubContentImplEmits>()

const subContext = injectDropdownMenuSubContext()

const a11y = useA11y(() => ({ role: 'menu' }))

const { onInteractOutside } = useDismissableLayer({
  emit,
  onDismiss: () => subContext.onOpenChange(false),
})

/** Swallow taps on the sub-menu surface so they don't reach the backdrop. */
function stopTap(event: any) {
  event?.stopPropagation?.()
}
</script>

<template>
  <!-- full-screen layer: a tap on the empty area dismisses the sub-menu -->
  <OverlayBackdrop
    :backdrop-style="props.backdropStyle"
    @tap="onInteractOutside"
  >
    <Primitive
      :as="as"
      :data-state="subContext.open.value ? 'open' : 'closed'"
      v-bind="{ ...$attrs, ...a11y }"
      @tap="stopTap"
    >
      <slot />
    </Primitive>
  </OverlayBackdrop>
</template>
