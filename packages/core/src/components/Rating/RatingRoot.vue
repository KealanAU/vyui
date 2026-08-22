<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import { useVModel } from '@/shared/composables/useVModel'
import { computed, ref, toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { createContext, useForwardExpose } from '@/shared'

export interface RatingRootContext {
  modelValue: Ref<number>
  items: ComputedRef<number[]>
  hoveredRating: Ref<number>
  disabled: Ref<boolean>
  step: Ref<number>
  changeModelValue: (rating: number) => void
  changeHoveredRating: (rating: number) => void
}

export interface RatingRootProps extends PrimitiveProps {
  /** The controlled value of the rating. Can be bound with `v-model`. */
  modelValue?: number
  /** The value of the rating when initially rendered. Use when you do not need to control the state. */
  defaultValue?: number
  /** Total number of rating items rendered. */
  length?: number
  /** Granularity of a single item. Allows half / quarter / tenth stars. */
  step?: 1 | 0.5 | 0.25 | 0.1
  /** When true, tapping the currently-selected rating clears the value. */
  clearable?: boolean
  /** When true, hovering over items previews the rating (web only — Lynx native has no hover). */
  hoverable?: boolean
  /** When true, all interactions are blocked. */
  disabled?: boolean
  /** Layout direction of the rating items. */
  orientation?: 'horizontal' | 'vertical'
}

export type RatingRootEmits = {
  /** Event handler called when the value changes. */
  'update:modelValue': [payload: number]
}

export const [injectRatingRootContext, provideRatingRootContext]
  = createContext<RatingRootContext>('RatingRoot')
</script>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<RatingRootProps>(), {
  as: 'view',
  orientation: 'horizontal',
  length: 5,
  step: 1,
  clearable: false,
  hoverable: false,
  disabled: false,
})
const emits = defineEmits<RatingRootEmits>()

defineSlots<{
  default?: (props: {
    modelValue: number | undefined
    items: number[]
  }) => any
}>()

const { length, disabled, clearable, hoverable, step } = toRefs(props)

const { forwardRef } = useForwardExpose()

const modelValue = useVModel<RatingRootProps, 'modelValue', 'update:modelValue'>(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? 0,
  passive: (props.modelValue === undefined) as false,
}) as Ref<number>

const items = computed(() => {
  return Array.from({ length: length.value }, (_, i) => i + 1)
})

const hoveredRating = ref<number>(0)

function changeModelValue(rating: number) {
  if (disabled.value)
    return

  if (clearable.value && modelValue.value === rating) {
    hoveredRating.value = 0
    modelValue.value = 0
  }
  else {
    modelValue.value = rating
  }
}

function changeHoveredRating(rating: number) {
  if (disabled.value || !hoverable.value)
    return

  hoveredRating.value = rating
}

provideRatingRootContext({
  modelValue,
  items,
  hoveredRating,
  disabled,
  step,
  changeModelValue,
  changeHoveredRating,
})
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :data-orientation="orientation"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot
      :items="items"
      :model-value="modelValue"
    />
  </Primitive>
</template>
