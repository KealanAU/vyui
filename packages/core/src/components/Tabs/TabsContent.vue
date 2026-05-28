<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { useForwardExpose } from '@/shared'

export interface TabsContentProps extends PrimitiveProps {
  /** A unique value that associates the content with a trigger. */
  value: StringOrNumber
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectTabsRootContext } from './TabsRoot.vue'
import { makeContentId, makeTriggerId } from './utils'

const props = defineProps<TabsContentProps>()

const { forwardRef } = useForwardExpose()
const rootContext = injectTabsRootContext()
const triggerId = computed(() => makeTriggerId(rootContext.baseId, props.value))
const contentId = computed(() => makeContentId(rootContext.baseId, props.value))

const isSelected = computed(() => props.value === rootContext.modelValue.value)

onMounted(() => {
  rootContext.registerContent(props.value)
})

onBeforeUnmount(() => {
  rootContext.unregisterContent(props.value)
})
</script>

<template>
  <Primitive
    v-if="forceMount || isSelected"
    :id="contentId"
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :data-state="isSelected ? 'active' : 'inactive'"
    :data-orientation="rootContext.orientation.value"
  >
    <slot />
  </Primitive>
</template>
