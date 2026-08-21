<script lang="ts">
import type { InputConfirmType } from '@/components/Input'

export interface NumberFieldInputProps {
  /** Placeholder shown when the field is empty. */
  placeholder?: string
  /** On-screen return-key label. */
  confirmType?: InputConfirmType
  /** Id of the underlying input element. Falls back to the Root's `id`. */
  id?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/Input'
import { useForwardExpose } from '@/shared'
import { injectNumberFieldRootContext } from './NumberFieldRoot.vue'

defineProps<NumberFieldInputProps>()

const context = injectNumberFieldRootContext()
useForwardExpose()

// `digit` shows a pure 0-9 keypad (no decimal / sign) — only safe when the
// field can never hold a fractional or negative value. Otherwise use `number`,
// which raises the decimal-capable numeric keyboard.
const inputType = computed<'number' | 'digit'>(() => {
  const integerStep = Number.isInteger(context.step.value)
  const nonNegative = context.min.value >= 0
  return integerStep && nonNegative ? 'digit' : 'number'
})

// Native input filter: digits, an optional single leading `-` (only when the
// field allows negatives), and an optional single decimal point (only when a
// fractional value is reachable). The native side applies this character-by-
// character; `setValue` re-validates on commit.
const inputFilter = computed(() => {
  const allowSign = context.min.value < 0
  const allowDecimal = !Number.isInteger(context.step.value)
    || !Number.isInteger(context.min.value)
    || !Number.isInteger(context.max.value)
  const sign = allowSign ? '-?' : ''
  const dot = allowDecimal ? '.?' : ''
  return `^${sign}[0-9]*${dot}[0-9]*$`
})

const disabled = computed(() => context.disabled.value)
const readonly = computed(() => context.readonly.value)

function handleInput(value: string) {
  context.setValue(value)
}

function handleBlur() {
  // Re-commit on blur so a half-typed value (e.g. `1.`) normalizes and a value
  // out of bounds snaps back into range with the displayed text.
  context.setValue(context.modelValue.value)
}
</script>

<template>
  <Input
    :id="id ?? context.id.value"
    :model-value="context.textValue.value"
    :type="inputType"
    :input-filter="inputFilter"
    :placeholder="placeholder"
    :confirm-type="confirmType"
    :disabled="disabled"
    :readonly="readonly"
    :data-disabled="disabled ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
    @update:model-value="handleInput"
    @blur="handleBlur"
  >
    <slot />
  </Input>
</template>
