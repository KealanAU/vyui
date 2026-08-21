<script lang="ts">
import theme from '../theme/progress'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type ProgressTV = ThemeTV<typeof theme>
type ProgressVariants = VariantProps<ProgressTV>

export interface ProgressProps {
  /** Current value. `null` (or omitted) renders the indeterminate animation. */
  modelValue?: number | null
  /** Maximum value, or an array of step labels (length - 1 = max). */
  max?: number | Array<any>
  /** Show the current value as a percentage label above the bar. */
  status?: boolean
  /** Reverse the visual direction. */
  inverted?: boolean
  size?: ProgressVariants['size']
  color?: ProgressVariants['color']
  /** @defaultValue 'horizontal' */
  orientation?: ProgressVariants['orientation']
  /** @defaultValue 'carousel' */
  animation?: ProgressVariants['animation']
  class?: ClassValue
  ui?: Partial<Record<keyof ProgressTV['slots'], ClassValue>>
}

export interface ProgressEmits {
  (e: 'update:modelValue', value: number | null): void
}

export type ProgressSlots = {
  status(props: { percent?: number }): any
} & {
  [key: string]: (props: { step: any }) => any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { ProgressRoot, ProgressIndicator } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<ProgressProps>(), {
  inverted: false,
  modelValue: null,
  orientation: 'horizontal',
})
const emit = defineEmits<ProgressEmits>()
defineSlots<ProgressSlots>()
const slots = useSlots()

const isIndeterminate = computed(() => props.modelValue === null || props.modelValue === undefined)
const hasSteps = computed(() => Array.isArray(props.max))

const realMax = computed(() => {
  if (isIndeterminate.value || !props.max) return undefined
  if (Array.isArray(props.max)) return props.max.length - 1
  return Number(props.max)
})

const percent = computed(() => {
  if (isIndeterminate.value) return undefined
  const v = props.modelValue!
  const max = realMax.value ?? 100
  if (v < 0) return 0
  if (v > max) return 100
  return Math.round((v / max) * 100)
})

const indicatorStyle = computed(() => {
  if (percent.value === undefined) return undefined
  if (props.orientation === 'vertical') {
    return { transform: `translateY(${props.inverted ? '' : '-'}${100 - percent.value}%)` }
  }
  return { transform: `translateX(${props.inverted ? '' : '-'}${100 - percent.value}%)` }
})

const statusStyle = computed(() => {
  // Lynx CSS doesn't support the `fit-content` keyword for sizing — fall back
  // to `auto` when no percent is available so the status block sizes to its
  // intrinsic text width without throwing on Lynx native.
  const dim = props.orientation === 'vertical' ? 'height' : 'width'
  return { [dim]: percent.value ? `${percent.value}%` : 'auto' }
})

function stepVariant(index: number): 'active' | 'first' | 'other' | 'last' {
  const v = Number(props.modelValue)
  const isActive = index === v
  const isFirst = index === 0
  const isLast = index === realMax.value
  if (isActive && !isFirst) return 'active'
  if (isFirst && isActive) return 'first'
  if (isLast && isActive) return 'last'
  return 'other'
}

const { ui } = useStyledComponent('progress', theme, () => ({
  animation: props.animation,
  size: props.size,
  color: props.color,
  orientation: props.orientation,
  inverted: props.inverted,
}))
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <view
      v-if="!isIndeterminate && (status || !!slots.status)"
      :class="ui.status({ class: props.ui?.status })"
      :style="statusStyle"
    >
      <slot name="status" :percent="percent">
        <text>{{ percent }}%</text>
      </slot>
    </view>

    <ProgressRoot
      :model-value="modelValue"
      :max="realMax"
      :class="ui.base({ class: props.ui?.base })"
      @update:model-value="emit('update:modelValue', $event ?? null)"
    >
      <ProgressIndicator
        :class="ui.indicator({ class: props.ui?.indicator })"
        :style="indicatorStyle"
      />
    </ProgressRoot>

    <view v-if="hasSteps" :class="ui.steps({ class: props.ui?.steps })">
      <view
        v-for="(step, index) in (max as Array<any>)"
        :key="index"
        :class="ui.step({ class: props.ui?.step, step: stepVariant(index) })"
      >
        <slot :name="`step-${index}`" :step="step">
          <text>{{ step }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
