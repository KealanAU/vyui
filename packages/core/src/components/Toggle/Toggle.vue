<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export type ToggleEmits = {
  /** Event handler called when the value of the toggle changes. */
  'update:modelValue': [value: boolean]
}

export type DataState = 'on' | 'off'

export interface ToggleProps extends PrimitiveProps {
  /**
   * The pressed state of the toggle when it is initially rendered. Use when you do not need to control its open state.
   */
  defaultValue?: boolean
  /** The controlled pressed state of the toggle. Can be bind as `v-model`. */
  modelValue?: boolean | null
  /** When `true`, prevents the user from interacting with the toggle. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y, useStandardVModel } from '@/shared/composables'

const props = withDefaults(defineProps<ToggleProps>(), {
  modelValue: undefined,
  disabled: false,
  as: 'view',
})

const emits = defineEmits<ToggleEmits>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Current state */
    state: typeof dataState.value
    /** Current pressed state */
    pressed: typeof modelValue.value
    /** Current disabled state */
    disabled: boolean
  }) => any
}>()

const { forwardRef } = useForwardExpose()

const modelValue = useStandardVModel<boolean>(props, emits)

function togglePressed() {
  if (props.disabled)
    return
  modelValue.value = !modelValue.value
}

const dataState = computed<DataState>(() => {
  return modelValue.value ? 'on' : 'off'
})

const a11y = useA11y(() => ({
  role: 'button',
  state: modelValue.value ? 'pressed' : 'not pressed',
  disabled: props.disabled,
}))

</script>

<template>
  <Primitive
    v-bind="a11y"
    :ref="forwardRef"
    :as-child="props.asChild"
    :as="as"
    :class="{ 'ui-on': dataState === 'on', 'ui-off': dataState === 'off', 'ui-disabled': disabled }"
    :data-state="dataState"
    :data-disabled="disabled ? '' : undefined"
    :disabled="disabled ? '' : undefined"
    @tap="togglePressed"
  >
    <slot
      :model-value="modelValue"
      :disabled="disabled"
      :pressed="modelValue"
      :state="dataState"
    />

  </Primitive>
</template>
