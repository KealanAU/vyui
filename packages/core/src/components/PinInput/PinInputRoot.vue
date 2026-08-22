<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import { createContext } from '@/shared'

export type PinInputType = 'text' | 'number'

export interface PinInputRootProps extends PrimitiveProps {
  /** The controlled value of the pin input. Can be bound with `v-model`. */
  modelValue?: string[] | null
  /** The value of the pin input when initially rendered. */
  defaultValue?: string[]
  /** The placeholder character shown in empty inputs. */
  placeholder?: string
  /** When `true`, inputs render as password fields. */
  mask?: boolean
  /** When `true`, enables one-time-code autofill on mobile. */
  otp?: boolean
  /** The value type for the inputs. */
  type?: PinInputType
  /** When `true`, prevents the user from interacting with the pin input. */
  disabled?: boolean
  /** Id of the element. */
  id?: string
}

export type PinInputRootEmits = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: string[]]
  /** Event handler called when every input has been filled. */
  'complete': [value: string[]]
}

export interface PinInputRootContext {
  modelValue: Ref<string[]>
  mask: Ref<boolean>
  otp: Ref<boolean>
  placeholder: Ref<string>
  type: Ref<PinInputType>
  disabled: Ref<boolean>
  isCompleted: ComputedRef<boolean>
  isNumericMode: ComputedRef<boolean>
  inputElements: Ref<Set<any>>
  onInputElementChange: (el: any) => void
  onInputElementRemove: (el: any) => void
  updateModelValueAt: (index: number, value: string) => void
  updateModelValueRange: (startIndex: number, value: string) => void
  focusNext: (index: number) => void
  focusPrev: (index: number) => void
}

export const [injectPinInputRootContext, providePinInputRootContext]
  = createContext<PinInputRootContext>('PinInputRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@/shared/composables/useVModel'
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useFocus } from '@/shared/composables'

const props = withDefaults(defineProps<PinInputRootProps>(), {
  as: 'view',
  placeholder: '',
  type: 'text',
})
const emits = defineEmits<PinInputRootEmits>()

defineSlots<{
  default?: (props: { modelValue: string[] }) => any
}>()

const { mask, otp, placeholder, type, disabled } = toRefs(props)
const { forwardRef } = useForwardExpose()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? [],
  passive: (props.modelValue === undefined) as false,
  deep: true,
}) as Ref<string[]>

const isNumericMode = computed(() => props.type === 'number')

// Ordered registry of input elements — Set keeps mount order, which equals
// the index order in the template.
const inputElements = ref<Set<any>>(new Set())
const orderedInputs = computed(() => [...inputElements.value])

function onInputElementChange(el: any) {
  if (el)
    inputElements.value.add(el)
}
function onInputElementRemove(el: any) {
  inputElements.value.delete(el)
}

const isCompleted = computed(() => {
  const filled = (modelValue.value ?? []).filter(v => v !== '' && v != null)
  return inputElements.value.size > 0 && filled.length === inputElements.value.size
})

function updateModelValueAt(index: number, value: string) {
  if (isNumericMode.value && value !== '' && !/^\d$/.test(value))
    return
  const next = [...(modelValue.value ?? [])]
  next[index] = value
  modelValue.value = next
}

/**
 * Spread a multi-character string (a paste, or fast typing) across cells from
 * `startIndex`, one character per cell, dropping any overflow. Focus lands on
 * the cell after the last one filled.
 */
function updateModelValueRange(startIndex: number, value: string) {
  const chars = (isNumericMode.value ? value.replace(/\D/g, '') : value).split('')
  if (!chars.length)
    return
  const count = orderedInputs.value.length
  const next = [...(modelValue.value ?? [])]
  let lastIndex = startIndex
  for (let i = 0; i < chars.length && startIndex + i < count; i++) {
    next[startIndex + i] = chars[i]
    lastIndex = startIndex + i
  }
  modelValue.value = next
  focusAt(Math.min(lastIndex + 1, count - 1))
}

// Focus must land after Vue flushes the model update — focusing synchronously
// races the re-render and the keystroke stays in the current cell.
function focusAt(index: number) {
  nextTick(() => useFocus(orderedInputs.value[index]))
}

function focusNext(index: number) {
  focusAt(index + 1)
}
function focusPrev(index: number) {
  focusAt(index - 1)
}

watch(modelValue, () => {
  if (isCompleted.value)
    emits('complete', modelValue.value)
}, { deep: true })

providePinInputRootContext({
  modelValue,
  mask,
  otp,
  placeholder,
  type,
  disabled,
  isCompleted,
  isNumericMode,
  inputElements,
  onInputElementChange,
  onInputElementRemove,
  updateModelValueAt,
  updateModelValueRange,
  focusNext,
  focusPrev,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :data-complete="isCompleted ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot :model-value="modelValue" />
  </Primitive>
</template>
