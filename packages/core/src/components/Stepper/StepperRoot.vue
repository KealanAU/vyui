<script lang="ts">
import type { Ref } from 'vue'
import type { DataOrientation, Direction, ElementHandle } from '@/shared/types'
import type { PrimitiveProps } from '@/components/Primitive'
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { createContext, useDirection, useForwardExpose } from '@/shared'
import { useStandardVModel } from '@/shared/composables'

export interface StepperRootContext {
  modelValue: Ref<number | undefined>
  changeModelValue: (value: number) => void
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  linear: Ref<boolean>
  totalStepperItems: Ref<Set<ElementHandle>>
}

export interface StepperRootProps extends PrimitiveProps {
  /**
   * The value of the step that should be active when initially rendered. Use when you do not need to control the state of the steps.
   */
  defaultValue?: number
  /**
   * The orientation the steps are laid out.
   * Mainly so arrow navigation is done accordingly (left & right vs. up & down).
   * @defaultValue horizontal
   */
  orientation?: DataOrientation
  /**
   * The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /** The controlled value of the step to activate. Can be bound as `v-model`. */
  modelValue?: number
  /** Whether or not the steps must be completed in order. */
  linear?: boolean
}
export type StepperRootEmits = {
  /** Event handler called when the value changes */
  'update:modelValue': [payload: number | undefined]
}

export const [injectStepperRootContext, provideStepperRootContext]
  = createContext<StepperRootContext>('StepperRoot')
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<StepperRootProps>(), {
  as: 'view',
  orientation: 'horizontal',
  linear: true,
  defaultValue: 1,
})
const emits = defineEmits<StepperRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current step */
    modelValue: number | undefined
    /** Total number of steps */
    totalSteps: number
    /** Whether or not the next step is disabled */
    isNextDisabled: boolean
    /** Whether or not the previous step is disabled */
    isPrevDisabled: boolean
    /** Whether or not the first step is active */
    isFirstStep: boolean
    /** Whether or not the last step is active */
    isLastStep: boolean
    /** Go to a specific step */
    goToStep: (step: number) => void
    /** Go to the next step */
    nextStep: () => void
    /** Go to the previous step */
    prevStep: () => void
    /** Whether or not there is a next step */
    hasNext: () => boolean
    /** Whether or not there is a previous step */
    hasPrev: () => boolean
  }) => any
}>()

const { dir: propDir, orientation: propOrientation, linear } = toRefs(props)
const dir = useDirection(propDir)

const totalStepperItems = ref<Set<ElementHandle>>(new Set())

const modelValue = useStandardVModel<number | undefined>(props, emits)

const totalStepperItemsArray = computed(() => Array.from(totalStepperItems.value))

const isFirstStep = computed(() => modelValue.value === 1)
const isLastStep = computed(() => modelValue.value === totalStepperItemsArray.value.length)

const totalSteps = computed(() => totalStepperItems.value.size)

function goToStep(step: number) {
  if (step > totalSteps.value)
    return

  if (step < 1)
    return

  const item = totalStepperItemsArray.value[step - 1]
  if (item && typeof (item as any).getAttribute === 'function' && !!(item as any).getAttribute('disabled'))
    return

  if (linear.value) {
    if (step > (modelValue.value ?? 1) + 1)
      return
  }

  modelValue.value = step
}

function nextStep() {
  goToStep((modelValue.value ?? 1) + 1)
}

function prevStep() {
  goToStep((modelValue.value ?? 1) - 1)
}

function hasNext() {
  return (modelValue.value ?? 1) < totalSteps.value
}

function hasPrev() {
  return (modelValue.value ?? 1) > 1
}

const nextStepperItem = ref<any>(null)
const prevStepperItem = ref<any>(null)
const isNextDisabled = computed(() => {
  const el = nextStepperItem.value
  if (!el) return true
  return typeof (el as any).getAttribute === 'function' ? (el as any).getAttribute('disabled') === '' : false
})
const isPrevDisabled = computed(() => {
  const el = prevStepperItem.value
  if (!el) return true
  return typeof (el as any).getAttribute === 'function' ? (el as any).getAttribute('disabled') === '' : false
})

watch(modelValue, async () => {
  await nextTick(() => {
    nextStepperItem.value = totalStepperItemsArray.value.length && modelValue.value! < totalStepperItemsArray.value.length ? totalStepperItemsArray.value[modelValue.value!] : null
    prevStepperItem.value = totalStepperItemsArray.value.length && modelValue.value! > 1 ? totalStepperItemsArray.value[modelValue.value! - 2] : null
  })
})
watch(totalStepperItemsArray, async () => {
  await nextTick(() => {
    nextStepperItem.value = totalStepperItemsArray.value.length && modelValue.value! < totalStepperItemsArray.value.length ? totalStepperItemsArray.value[modelValue.value!] : null
    prevStepperItem.value = totalStepperItemsArray.value.length && modelValue.value! > 1 ? totalStepperItemsArray.value[modelValue.value! - 2] : null
  })
})

provideStepperRootContext({
  modelValue,
  changeModelValue: (value: number) => {
    modelValue.value = value
  },
  orientation: propOrientation,
  dir,
  linear,
  totalStepperItems,
})

defineExpose({
  goToStep,
  nextStep,
  prevStep,
  modelValue,
  totalSteps,
  isNextDisabled,
  isPrevDisabled,
  isFirstStep,
  isLastStep,
  hasNext,
  hasPrev,
})

useForwardExpose()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-linear="linear ? '' : undefined"
    :data-orientation="orientation"
  >
    <slot
      :model-value="modelValue"
      :total-steps="totalStepperItems.size"
      :is-next-disabled="isNextDisabled"
      :is-prev-disabled="isPrevDisabled"
      :is-first-step="isFirstStep"
      :is-last-step="isLastStep"
      :go-to-step="goToStep"
      :next-step="nextStep"
      :prev-step="prevStep"
      :has-next="hasNext"
      :has-prev="hasPrev"
    />

  </Primitive>
</template>
