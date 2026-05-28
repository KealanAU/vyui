<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectRatingRootContext } from './RatingRoot.vue'

export interface RatingItemIndicatorProps extends PrimitiveProps {
  /** The numeric step value (1, 1.5, 2, ...) this indicator represents. */
  step: number
}
</script>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<RatingItemIndicatorProps>(), { as: 'view' })

const rootContext = injectRatingRootContext()
const { forwardRef } = useForwardExpose()

const isActive = computed(() => {
  return (
    (rootContext.hoveredRating.value > 0 && props.step <= rootContext.hoveredRating.value)
    || (rootContext.hoveredRating.value === 0 && props.step <= rootContext.modelValue.value)
  )
})

const isVisible = computed(() => {
  return (
    rootContext.step.value === 1
    || props.step % 1 === 0
    || props.step === rootContext.hoveredRating.value
    || props.step === rootContext.modelValue.value
  )
})

function onTap() {
  if (rootContext.disabled.value)
    return
  rootContext.changeModelValue(props.step)
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    accessibility-traits="button"
    v-bind="$attrs"
    :data-state="isActive ? 'active' : undefined"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    :disabled="rootContext.disabled.value ? '' : undefined"
    @tap="onTap"
  >
    <slot v-if="isVisible" />
  </Primitive>
</template>
