<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { useForwardExpose } from '@/shared'

export interface TabsTriggerProps extends PrimitiveProps {
  /** A unique value that associates the trigger with a content. */
  value: StringOrNumber
  /** When `true`, prevents the user from interacting with the tab. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectTabsRootContext } from './TabsRoot.vue'
import { makeContentId, makeTriggerId } from './utils'

const props = withDefaults(defineProps<TabsTriggerProps>(), {
  disabled: false,
  as: 'view',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectTabsRootContext()

const triggerId = computed(() => makeTriggerId(rootContext.baseId, props.value))
const contentId = computed(() => rootContext.contentIds.value.has(props.value) ? makeContentId(rootContext.baseId, props.value) : undefined)

const isSelected = computed(() => props.value === rootContext.modelValue.value)

// Register the underlying Lynx shadow element with TabsRoot so TabsIndicator
// can measure it via `useElementRect` — replaces the DOM-only
// `querySelectorAll('[role="tab"]')` lookup.
//
// We defer the registration to a microtask after `onMounted` so the
// `triggers` map mutation lands AFTER Vue's patch phase has fully committed.
// Mutating a Map ref via `flush: 'post'` watcher during the same patch as
// nested Tabs mount can trigger `TabsIndicator`'s reactive watch mid-patch,
// producing `Cannot read property 'parent' of null` from `node-ops.parentNode`.
//
// Lynx's PrimJS engine doesn't expose `queueMicrotask`, so we hop the
// microtask queue via `Promise.resolve().then(...)`.
onMounted(() => {
  Promise.resolve().then(() => {
    if (currentElement.value)
      rootContext.registerTrigger(props.value, currentElement.value)
  })
})

onBeforeUnmount(() => {
  rootContext.unregisterTrigger(props.value)
})

const a11y = useA11y(() => ({
  role: 'tab',
  state: isSelected.value ? 'selected' : 'unselected',
  disabled: props.disabled,
}))
</script>

<template>
  <Primitive
    v-bind="a11y"
    :id="triggerId"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :data-state="isSelected ? 'active' : 'inactive'"
    :disabled="disabled"
    :data-disabled="disabled ? '' : undefined"
    :data-orientation="rootContext.orientation.value"
    @tap="() => { if (!disabled) rootContext.changeModelValue(value) }"
    @layoutchange="rootContext.notifyLayoutChange"
  >
    <slot />
  </Primitive>
</template>
