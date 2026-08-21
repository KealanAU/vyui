<script lang="ts">
import theme from '../theme/slider'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type SliderTV = ThemeTV<typeof theme>
type SliderVariants = VariantProps<SliderTV>

export interface SliderProps {
  /**
   * Controlled value. Accepts a single `number` for one thumb or `number[]` for
   * multi-thumb ranges. The shape is preserved end-to-end — pass `50`, get
   * `50` back on `update:modelValue`; pass `[10, 90]`, get `[10, 90]` back.
   */
  modelValue?: number | number[]
  /** Initial value when uncontrolled. Same shape rules as `modelValue`. */
  defaultValue?: number | number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  orientation?: SliderVariants['orientation']
  /** Visually invert the track direction. */
  inverted?: boolean
  /** Minimum step distance between adjacent thumbs (multi-thumb only). */
  minStepsBetweenThumbs?: number
  color?: SliderVariants['color']
  size?: SliderVariants['size']
  /** Forwarded to the underlying core control. */
  name?: string
  class?: ClassValue
  ui?: Partial<Record<keyof SliderTV['slots'], ClassValue>>
}

export interface SliderEmits {
  (e: 'update:modelValue', value: number | number[]): void
}

export interface SliderSlots {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  orientation: 'horizontal',
  disabled: false,
})
const emit = defineEmits<SliderEmits>()
defineSlots<SliderSlots>()

// `SliderRoot` accepts both shapes natively and emits in whichever shape the
// consumer binds with, so forward through without normalizing.
const thumbsCount = computed(() => {
  const src = props.modelValue ?? props.defaultValue
  if (typeof src === 'number') return 1
  return src?.length ?? 1
})

const { ui } = useStyledComponent('slider', theme, () => ({
  color: props.color,
  size: props.size,
  orientation: props.orientation,
  disabled: props.disabled,
}))
</script>

<template>
  <SliderRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :orientation="orientation"
    :inverted="inverted"
    :min-steps-between-thumbs="minStepsBetweenThumbs"
    :name="name"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="(v: number | number[] | undefined) => v !== undefined && emit('update:modelValue', v)"
  >
    <SliderTrack :class="ui.track({ class: props.ui?.track })">
      <SliderRange :class="ui.range({ class: props.ui?.range })" />
    </SliderTrack>
    <SliderThumb
      v-for="count in thumbsCount"
      :key="count"
      :class="ui.thumb({ class: props.ui?.thumb })"
    />
  </SliderRoot>
</template>
