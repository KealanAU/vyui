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
import { makeTriggerId } from './utils'

const props = withDefaults(defineProps<TabsTriggerProps>(), {
  disabled: false,
  as: 'view',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectTabsRootContext()

const triggerId = computed(() => makeTriggerId(rootContext.baseId, props.value))

const isSelected = computed(() => props.value === rootContext.modelValue.value)

// Register the underlying Lynx shadow element with TabsRoot so TabsIndicator can
// measure it via `useElementRect`, replacing the DOM-only
// `querySelectorAll('[role="tab"]')` lookup.
//
// Registration is deferred to a microtask after `onMounted` so the `triggers`
// map mutation lands AFTER Vue's patch phase commits: mutating it mid-patch can
// wake `TabsIndicator`'s watch and produce `Cannot read property 'parent' of
// null` from `node-ops.parentNode`. PrimJS has no `queueMicrotask`, so the hop
// goes through `Promise.resolve().then(...)`.
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
  selected: isSelected.value,
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
    :class="{ 'ui-active': isSelected, 'ui-inactive': !isSelected, 'ui-disabled': disabled }"
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
