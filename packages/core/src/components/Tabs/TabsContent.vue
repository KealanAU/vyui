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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectTabsRootContext } from './TabsRoot.vue'
import { makeContentId, makeTriggerId } from './utils'

const props = defineProps<TabsContentProps>()

const { forwardRef } = useForwardExpose()
const rootContext = injectTabsRootContext()
const triggerId = computed(() => makeTriggerId(rootContext.baseId, props.value))
const contentId = computed(() => makeContentId(rootContext.baseId, props.value))

// Follows `contentValue`, not `modelValue`: with `deferContent` on the root
// the panel swap intentionally trails the trigger flip by one flush.
const isSelected = computed(() => props.value === rootContext.contentValue.value)

// `unmountOnHide: false` keeps a panel mounted once its tab has been visited
// (lazy, not upfront — mounting is the expensive half on Lynx). Deselecting
// then hides it via `display: none` instead of unmounting.
const hasBeenSelected = ref(isSelected.value)
watch(isSelected, (selected) => {
  if (selected)
    hasBeenSelected.value = true
})

const isMounted = computed(() =>
  props.forceMount || isSelected.value
  || (!rootContext.unmountOnHide.value && hasBeenSelected.value))

// Only the keep-mounted case hides itself; `forceMount` panels keep the
// existing contract where the consumer owns visibility (animation libraries).
const isKeptHidden = computed(() =>
  !isSelected.value && !props.forceMount
  && !rootContext.unmountOnHide.value && hasBeenSelected.value)

onMounted(() => {
  rootContext.registerContent(props.value)
})

onBeforeUnmount(() => {
  rootContext.unregisterContent(props.value)
})
</script>

<template>
  <Primitive
    v-if="isMounted"
    :id="contentId"
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :data-state="isSelected ? 'active' : 'inactive'"
    :data-orientation="rootContext.orientation.value"
    :style="isKeptHidden ? { display: 'none' } : undefined"
    :accessibility-elements-hidden="isKeptHidden || undefined"
  >
    <slot />
  </Primitive>
</template>
