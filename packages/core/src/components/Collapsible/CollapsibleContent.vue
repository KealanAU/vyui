<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface CollapsibleContentProps extends PrimitiveProps {
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<CollapsibleContentProps>()

const rootContext = injectCollapsibleRootContext()
rootContext.contentId ||= useId(undefined, 'vy-collapsible-content')

const { forwardRef } = useForwardExpose()

// When unmountOnHide is false the content stays in the tree across close, with
// a `hidden=""` attribute (mirrors reka-ui's CSS-driven hidden). Otherwise the
// content is removed entirely (v-if). `forceMount` overrides both.
const isOpen = computed(() => rootContext.open.value)
const isHidden = computed(() => !isOpen.value)
const shouldMount = computed(
  () => props.forceMount || isOpen.value || !rootContext.unmountOnHide.value,
)
</script>

<template>
  <Primitive
    v-if="shouldMount"
    v-bind="$attrs"
    :id="rootContext.contentId"
    :ref="forwardRef"
    :as-child="props.asChild"
    :as="as"
    :data-state="isOpen ? 'open' : 'closed'"
    :data-disabled="rootContext.disabled?.value ? '' : undefined"
    :hidden="!rootContext.unmountOnHide.value && isHidden ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
