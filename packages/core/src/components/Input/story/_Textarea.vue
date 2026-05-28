<script setup lang="ts">
import { ref } from 'vue'
import { Textarea } from '..'
import type { TextareaExposed } from '..'

const props = defineProps<{
  modelValue?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
  maxLines?: number
  lineSpacing?: number | string
  bounces?: boolean
}>()

const value = ref<string>(props.modelValue ?? '')
const lastConfirm = ref<string | null>(null)
const lastSelection = ref<[number, number] | null>(null)
const textareaRef = ref<TextareaExposed | null>(null)
</script>

<template>
  <view>
    <Textarea
      ref="textareaRef"
      v-model="value"
      :default-value="props.defaultValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :max-length="props.maxLength"
      :max-lines="props.maxLines"
      :line-spacing="props.lineSpacing"
      :bounces="props.bounces"
      data-testid="textarea"
      @confirm="lastConfirm = $event"
      @selection-change="(s: number, e: number) => (lastSelection = [s, e])"
    />
    <text data-testid="value">{{ value }}</text>
    <text data-testid="last-confirm">{{ lastConfirm ?? '' }}</text>
    <text data-testid="last-selection">{{ lastSelection ? JSON.stringify(lastSelection) : '' }}</text>
  </view>
</template>
