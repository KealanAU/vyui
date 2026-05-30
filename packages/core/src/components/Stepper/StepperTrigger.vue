<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { onMounted, onUnmounted } from 'vue'
import { useForwardExpose } from '@/shared'

export interface StepperTriggerProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectStepperItemContext } from './StepperItem.vue'
import { injectStepperRootContext } from './StepperRoot.vue'

withDefaults(defineProps<StepperTriggerProps>(), {
  as: 'view',
})

const rootContext = injectStepperRootContext()
const itemContext = injectStepperItemContext()

function handleTap() {
  if (itemContext.disabled.value)
    return
  if (rootContext.linear.value) {
    if (itemContext.step.value <= rootContext.modelValue.value! || itemContext.step.value === rootContext.modelValue.value! + 1) {
      rootContext.changeModelValue(itemContext.step.value)
    }
  }
  else {
    rootContext.changeModelValue(itemContext.step.value)
  }
}

const { forwardRef, currentElement } = useForwardExpose()

const a11y = useA11y(() => ({
  role: 'button',
  disabled: itemContext.disabled.value || !itemContext.isFocusable.value,
  state: itemContext.state.value,
}))

onMounted(() => {
  rootContext.totalStepperItems.value.add(currentElement.value)
})

onUnmounted(() => {
  rootContext.totalStepperItems.value.delete(currentElement.value)
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="a11y"
    :as="as"
    :as-child="asChild"
    :data-state="itemContext.state.value"
    :disabled="itemContext.disabled.value || !itemContext.isFocusable.value ? '' : undefined"
    :data-disabled="itemContext.disabled.value || !itemContext.isFocusable.value ? '' : undefined"
    :data-orientation="rootContext.orientation.value"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
