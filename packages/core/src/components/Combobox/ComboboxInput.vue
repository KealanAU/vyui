<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxInputProps extends PrimitiveProps {
  /** The text input value. Can be bound with `v-model`. */
  modelValue?: string
  /** When `true`, prevents the user from interacting with the input. */
  disabled?: boolean
  /** Placeholder text shown when the input is empty. */
  placeholder?: string
  /** The display value of the input for the selected item. Does not work with `multiple`. */
  displayValue?: (val: any) => string
}

export type ComboboxInputEmits = {
  'update:modelValue': [value: string]
}
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useStandardVModel } from '@/shared/composables'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxInputProps>(), {
  as: 'input',
  modelValue: undefined,
  disabled: false,
})

const emits = defineEmits<ComboboxInputEmits>()

const rootContext = injectComboboxRootContext()

const modelValue = useStandardVModel<string>(props, emits, '')

// `renderValue` is what gets bound to `:value` on the native input. We
// deliberately decouple it from `modelValue` so that when the user types,
// `modelValue` updates without re-pushing the entire growing string back to
// the native side through vue-lynx's `patchProp → SET_PROP` op. Programmatic
// updates (e.g. selecting an item) still flow through because they don't
// match `lastNativeValue`.
const renderValue = ref(modelValue.value ?? '')
let lastNativeValue: string | undefined

watch(modelValue, (next) => {
  const v = next ?? ''
  if (v === lastNativeValue)
    return
  renderValue.value = v
})

function resolveDisplayValue(): string {
  const rootValue = rootContext.modelValue.value

  if (props.displayValue)
    return props.displayValue(rootValue)

  if (rootContext.multiple.value)
    return ''

  if (rootValue === undefined || rootValue === null || rootValue === '')
    return ''

  if (typeof rootValue === 'object')
    return ''

  return String(rootValue)
}

// When the selected value changes (and the user is not actively typing),
// reflect the selected item's text back into the input.
watch(
  () => rootContext.modelValue.value,
  () => {
    if (rootContext.resetSearchTermOnSelect.value) {
      modelValue.value = resolveDisplayValue()
    }
  },
  { immediate: true, deep: true },
)

// When the dropdown closes, optionally reset the search term display.
watch(
  () => rootContext.open.value,
  (isOpen) => {
    if (!isOpen && rootContext.resetSearchTermOnBlur.value)
      modelValue.value = resolveDisplayValue()
  },
)

function openIfClosed() {
  if (!rootContext.open.value && !rootContext.disabled.value)
    rootContext.onOpenChange(true)
}

// The native runtime emits `input` as the user types.
function handleInput(event: any) {
  const value: string = event?.detail?.value ?? event?.target?.value ?? modelValue.value ?? ''
  lastNativeValue = value
  modelValue.value = value
  if (!rootContext.open.value)
    rootContext.onOpenChange(true)
  rootContext.filterSearch.value = value
}

// The native runtime emits `confirm` when the user submits the input.
function handleConfirm() {
  openIfClosed()
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :value="renderValue"
    :placeholder="placeholder"
    :disabled="disabled || rootContext.disabled.value"
    accessibility-traits="none"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    v-bind="$attrs"
    @input="handleInput"
    @confirm="handleConfirm"
  >
    <slot />
  </Primitive>
</template>
