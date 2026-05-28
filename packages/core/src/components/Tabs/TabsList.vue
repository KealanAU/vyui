<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface TabsListProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectTabsRootContext } from './TabsRoot.vue'

defineProps<TabsListProps>()

const { forwardRef, currentElement } = useForwardExpose()
const context = injectTabsRootContext()

context.tabsList = currentElement
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :data-orientation="context.orientation.value"
    @layoutchange="context.notifyLayoutChange"
  >
    <slot />
  </Primitive>
</template>
