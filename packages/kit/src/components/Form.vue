<script lang="ts">
import type { ClassValue } from '../composables/useStyledComponent'

export interface FormProps {
  /** Initial values, keyed by field name. Used by `reset()`. */
  defaultValues?: Record<string, unknown>
  /** When `true`, every nested field is disabled. */
  disabled?: boolean
  class?: ClassValue
}

export interface FormEmits {
  (e: 'submit', values: Record<string, unknown>): void
  (e: 'update:values', values: Record<string, unknown>): void
}

export interface FormSlots {
  default(props: {
    values: Record<string, unknown>
    errors: Record<string, string | null>
    submitting: boolean
  }): any
}

export interface FormExposed {
  /** Run sync validators and emit `submit` when clean. */
  submit: () => void
  /** Clear errors and restore field values to `defaultValues`. */
  reset: () => void
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { cnBase } from 'tailwind-variants'
import { FormRoot, type FormRootExposed } from '@vyui/core'

defineProps<FormProps>()
const emit = defineEmits<FormEmits>()
defineSlots<FormSlots>()

const rootRef = ref<FormRootExposed | null>(null)

function submit() {
  rootRef.value?.submit()
}

function reset() {
  rootRef.value?.reset()
}

defineExpose<FormExposed>({ submit, reset })
</script>

<template>
  <FormRoot
    ref="rootRef"
    :default-values="defaultValues"
    :disabled="disabled"
    @submit="emit('submit', $event)"
    @update:values="emit('update:values', $event)"
  >
    <template #default="slotProps">
      <view :class="cnBase($props.class)">
        <slot v-bind="slotProps" />
      </view>
    </template>
  </FormRoot>
</template>
