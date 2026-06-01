<script setup lang="ts">
import { ref } from 'vue'
import {
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
} from '..'

const props = defineProps<{
  modelValue?: number | null
  defaultValue?: number | null
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  readonly?: boolean
  controlled?: boolean
}>()

// `controlled` drives whether we bind v-model (controlled) or just read the
// emitted value (uncontrolled via defaultValue).
const value = ref<number | null>(props.modelValue ?? null)

function onUpdate(v: number | null) {
  value.value = v
}
</script>

<template>
  <view>
    <NumberFieldRoot
      v-if="controlled"
      v-model="value"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :disabled="props.disabled"
      :readonly="props.readonly"
      data-testid="root"
    >
      <NumberFieldDecrement data-testid="decrement">
        <text>-</text>
      </NumberFieldDecrement>
      <NumberFieldInput data-testid="input" />
      <NumberFieldIncrement data-testid="increment">
        <text>+</text>
      </NumberFieldIncrement>
    </NumberFieldRoot>

    <NumberFieldRoot
      v-else
      :default-value="props.defaultValue"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :disabled="props.disabled"
      :readonly="props.readonly"
      data-testid="root"
      @update:model-value="onUpdate"
    >
      <NumberFieldDecrement data-testid="decrement">
        <text>-</text>
      </NumberFieldDecrement>
      <NumberFieldInput data-testid="input" />
      <NumberFieldIncrement data-testid="increment">
        <text>+</text>
      </NumberFieldIncrement>
    </NumberFieldRoot>

    <text data-testid="value">{{ JSON.stringify(value) }}</text>
  </view>
</template>
