<script lang="ts">
import type { ComputedRef } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { createContext, useForwardExpose } from '@/shared'
import { injectRatingRootContext } from './RatingRoot.vue'

interface RatingItemContext {
  steps: ComputedRef<number[]>
}

export interface RatingItemProps extends PrimitiveProps {
  /** The 1-indexed position of this item within the rating. */
  item: number
}

export const [injectRatingItemContext, provideRatingItemContext]
  = createContext<RatingItemContext>('RatingItem')
</script>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<RatingItemProps>(), { as: 'view' })
defineSlots<{
  default?: (props: {
    steps: number[]
  }) => any
}>()

const rootContext = injectRatingRootContext()
const { forwardRef } = useForwardExpose()

const steps = computed(() => {
  const groupStartValue = (props.item - 1)
  const groupEndValue = props.item
  const stepSize = rootContext.step.value

  const numberOfSteps = Math.ceil((groupEndValue - groupStartValue) / stepSize)

  return Array.from({ length: numberOfSteps }, (_, index) =>
    Number((groupStartValue + (index + 1) * stepSize).toFixed(2)))
})

provideRatingItemContext({ steps })
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
  >
    <slot :steps="steps" />
  </Primitive>
</template>
