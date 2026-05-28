<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface PinInputInputProps extends PrimitiveProps {
  /** Position of the value this input binds to. */
  index: number
  /** When `true`, prevents the user from interacting with this input. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Primitive, usePrimitiveElement } from '@/components/Primitive'
import { injectPinInputRootContext } from './PinInputRoot.vue'

const props = withDefaults(defineProps<PinInputInputProps>(), {
  as: 'input',
})

const context = injectPinInputRootContext()
const { primitiveElement, currentElement } = usePrimitiveElement()

const currentValue = computed(() => context.modelValue.value?.[props.index] ?? '')
const disabled = computed(() => props.disabled || context.disabled.value)

/**
 * Lynx `<input>` emits `input` with the value on `event.detail.value`.
 * The cell is `maxlength="1"`, so typing yields a single character: it fills
 * this cell and advances focus. A multi-character value can still arrive from
 * a fast-typed run or a programmatic insert — it is spread one char per cell
 * from here onward. Clipboard pastes are handled by `handlePaste`.
 */
function handleInput(event: any) {
  let value: string = event?.detail?.value ?? event?.target?.value ?? ''
  if (context.isNumericMode.value)
    value = value.replace(/\D/g, '')
  if (value.length > 1) {
    context.updateModelValueRange(props.index, value)
    return
  }
  context.updateModelValueAt(props.index, value)
  if (value)
    context.focusNext(props.index)
  else
    context.focusPrev(props.index)
}

/**
 * Clipboard paste — spread the whole pasted string across cells from here on.
 * Reading from `clipboardData` (and preventing the default insert) keeps the
 * `maxlength="1"` cell from truncating the paste to its first character.
 */
function handlePaste(event: any) {
  const text: string = event?.clipboardData?.getData?.('text')
    ?? event?.detail?.value
    ?? ''
  if (!text)
    return
  event?.preventDefault?.()
  context.updateModelValueRange(props.index, text)
}

/** Select the cell's contents on focus so a retype replaces the digit. */
function handleFocus(event: any) {
  event?.target?.select?.()
}

onMounted(() => context.onInputElementChange(currentElement.value))
onUnmounted(() => context.onInputElementRemove(currentElement.value))
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    :value="currentValue"
    :placeholder="context.placeholder.value"
    :disabled="disabled || undefined"
    :maxlength="1"
    :type="context.mask.value ? 'password' : (context.isNumericMode.value ? 'digit' : 'text')"
    :data-disabled="disabled ? '' : undefined"
    :data-complete="context.isCompleted.value ? '' : undefined"
    @input="handleInput"
    @paste="handlePaste"
    @focus="handleFocus"
  >
    <slot />
  </Primitive>
</template>
