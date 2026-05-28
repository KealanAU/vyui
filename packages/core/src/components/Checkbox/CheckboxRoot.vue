<script lang="ts">
import type { Ref } from 'vue'
import type { CheckedState } from './utils'
import type { PrimitiveProps } from '@/components/Primitive'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { createContext, isNullish, isValueEqualOrExist, useForwardExpose } from '@/shared'
import { injectCheckboxGroupRootContext } from './CheckboxGroupRoot.vue'

export interface CheckboxRootProps<T = boolean> extends PrimitiveProps, FormFieldProps {
  /** The value of the checkbox when it is initially rendered. Use when you do not need to control its value. */
  defaultValue?: T | 'indeterminate'
  /** The controlled value of the checkbox. Can be binded with v-model. */
  modelValue?: T | 'indeterminate' | null
  /** When `true`, prevents the user from interacting with the checkbox */
  disabled?: boolean
  /**
   * The value given as data when submitted with a `name`.
   *  @defaultValue "on"
   */
  value?: AcceptableValue
  /** Id of the element */
  id?: string
  /**
   * The value used when the checkbox is checked. Defaults to `true`.
   */
  trueValue?: T
  /**
   * The value used when the checkbox is unchecked. Defaults to `false`.
   */
  falseValue?: T
}

export type CheckboxRootEmits<T = boolean> = {
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: T | 'indeterminate']
}

interface CheckboxRootContext {
  disabled: Ref<boolean>
  state: Ref<CheckedState>
}

export const [injectCheckboxRootContext, provideCheckboxRootContext]
  = createContext<CheckboxRootContext>('CheckboxRoot')
</script>

<script setup lang="ts" generic="T = boolean">
import { isEqual } from 'ohash'
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useStandardVModel } from '@/shared/composables'
import { getState } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CheckboxRootProps<T>>(), {
  modelValue: undefined,
  value: 'on',
  as: 'view',
  trueValue: (() => true) as unknown as undefined,
  falseValue: (() => false) as unknown as undefined,
})
const emits = defineEmits<CheckboxRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Current state */
    state: typeof checkboxState.value
  }) => any
}>()

const { forwardRef } = useForwardExpose()

const checkboxGroupContext = injectCheckboxGroupRootContext(null)

const modelValue = useStandardVModel<T | 'indeterminate'>(props as any, emits as any, props.falseValue as T | 'indeterminate')

const disabled = computed(() => checkboxGroupContext?.disabled.value || props.disabled)

const isChecked = computed(() => isEqual(modelValue.value, props.trueValue))

const checkboxState = computed<CheckedState>(() => {
  if (!isNullish(checkboxGroupContext?.modelValue.value)) {
    return isValueEqualOrExist(checkboxGroupContext.modelValue.value, props.value)
  }
  else {
    if (modelValue.value === 'indeterminate')
      return 'indeterminate'
    return isChecked.value
  }
})

function handleClick() {
  if (disabled.value)
    return
  if (!isNullish(checkboxGroupContext?.modelValue.value)) {
    const modelValueArray = [...(checkboxGroupContext.modelValue.value || [])]
    if (isValueEqualOrExist(modelValueArray, props.value)) {
      const index = modelValueArray.findIndex(i => isEqual(i, props.value))
      modelValueArray.splice(index, 1)
    }
    else {
      modelValueArray.push(props.value)
    }
    checkboxGroupContext.modelValue.value = modelValueArray
  }
  else {
    if (modelValue.value === 'indeterminate') {
      modelValue.value = props.trueValue as T
    }
    else {
      modelValue.value = isChecked.value ? props.falseValue as T : props.trueValue as T
    }
  }
}

provideCheckboxRootContext({
  disabled,
  state: checkboxState,
})
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :id="id"
    :ref="forwardRef"
    accessibility-traits="button"
    :accessibility-label="$attrs['accessibility-label']"
    :as-child="asChild"
    :as="as"
    :data-state="getState(checkboxState)"
    :data-disabled="disabled ? '' : undefined"
    :disabled="disabled"
    @tap="handleClick"
  >
    <slot
      :model-value="modelValue"
      :state="checkboxState"
    />
  </Primitive>
</template>
