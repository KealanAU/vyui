<script setup lang="ts">
import { ref } from 'vue'
import type { PinInputType } from '..'
import { PinInputInput, PinInputRoot } from '..'

const props = defineProps<{
  modelValue?: string[]
  length?: number
  placeholder?: string
  mask?: boolean
  type?: PinInputType
  disabled?: boolean
}>()

const value = ref<string[]>(props.modelValue ?? [])
const length = props.length ?? 4
const indexes = Array.from({ length }, (_, i) => i)

const lastComplete = ref<string[] | null>(null)
function onComplete(v: string[]) {
  lastComplete.value = v
}
</script>

<template>
  <view>
    <PinInputRoot
      v-model="value"
      :placeholder="props.placeholder"
      :mask="props.mask"
      :type="props.type"
      :disabled="props.disabled"
      data-testid="root"
      @complete="onComplete"
    >
      <PinInputInput
        v-for="i in indexes"
        :key="i"
        :index="i"
        :data-testid="`cell-${i}`"
      />
    </PinInputRoot>
    <text data-testid="value">{{ JSON.stringify(value) }}</text>
    <text data-testid="last-complete">{{ JSON.stringify(lastComplete) }}</text>
  </view>
</template>
