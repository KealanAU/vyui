<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

// Phase 2 limitation: PopoverAnchor is a no-op slot pass-through.
// Anchor-relative positioning requires @floating-ui/vue or getBoundingClientRect,
// neither of which is available in Lynx. This component exists for API
// compatibility only; it does not influence PopoverContent placement.

export interface PopoverAnchorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<PopoverAnchorProps>(), {
  as: 'view',
})

useForwardExpose()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
  >
    <slot />
  </Primitive>
</template>
