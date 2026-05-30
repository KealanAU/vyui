<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface PopoverCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverCloseProps>(), {
  as: 'view',
})

useForwardExpose()
const rootContext = injectPopoverRootContext()

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'button',
  label: (attrs['accessibility-label'] as string) || 'Close',
}))
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    v-bind="a11y"
    @tap="rootContext.onOpenChange(false)"
  >
    <slot />
  </Primitive>
</template>
