<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/slider'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.slider`.
 */
export const buildSlider = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).slider as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type SliderVariants = VariantProps<ReturnType<typeof buildSlider>>

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
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildSlider>['slots'], any>>
}

export interface SliderEmits {
  (e: 'update:modelValue', value: number | number[]): void
}

export interface SliderSlots {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  orientation: 'horizontal',
  disabled: false,
})
const emit = defineEmits<SliderEmits>()
defineSlots<SliderSlots>()

const appConfig = useAppConfig()

// `SliderRoot` now accepts both shapes natively and emits in whichever shape
// the consumer is binding with, so no normalization needed here — just
// forward through.
const thumbsCount = computed(() => {
  const src = props.modelValue ?? props.defaultValue
  if (typeof src === 'number') return 1
  return src?.length ?? 1
})

const ui = computed(() => buildSlider(appConfig)({
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
