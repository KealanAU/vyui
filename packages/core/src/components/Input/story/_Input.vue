<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '..'
import type { InputExposed, InputProps } from '..'

const props = defineProps<{
  modelValue?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
  type?: InputProps['type']
}>()

const value = ref<string>(props.modelValue ?? '')
const lastConfirm = ref<string | null>(null)
const lastFocus = ref<number>(0)
const lastBlur = ref<number>(0)

const inputRef = ref<InputExposed | null>(null)
const exposedReady = ref(false)

function onMounted() {
  exposedReady.value = inputRef.value !== null
}
</script>

<template>
  <view>
    <Input
      ref="inputRef"
      v-model="value"
      :default-value="props.defaultValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :max-length="props.maxLength"
      :type="props.type"
      data-testid="input"
      @vue:mounted="onMounted"
      @confirm="lastConfirm = $event"
      @focus="lastFocus = lastFocus + 1"
      @blur="lastBlur = lastBlur + 1"
    />
    <text data-testid="value">{{ value }}</text>
    <text data-testid="last-confirm">{{ lastConfirm ?? '' }}</text>
    <text data-testid="focus-count">{{ lastFocus }}</text>
    <text data-testid="blur-count">{{ lastBlur }}</text>
    <text data-testid="exposed-ready">{{ exposedReady }}</text>
  </view>
</template>
