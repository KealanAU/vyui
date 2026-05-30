<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { AcceptableValue, FormFieldProps, SingleOrMultipleProps } from '@/shared/types'
import type { PrimitiveProps } from '@/components/Primitive'
import { createContext, useForwardExpose } from '@/shared'

export interface ToggleGroupRootProps<T = AcceptableValue | AcceptableValue[]>
  extends PrimitiveProps, FormFieldProps, SingleOrMultipleProps<T> {
  /** When `true`, prevents the user from interacting with the toggle group and all its items. */
  disabled?: boolean
}
export type ToggleGroupRootEmits = {
  /** Event handler called when the value changes. */
  'update:modelValue': [payload: AcceptableValue | AcceptableValue[]]
}

interface ToggleGroupRootContext {
  isSingle: ComputedRef<boolean>
  modelValue: Ref<AcceptableValue | AcceptableValue[] | undefined>
  changeModelValue: (value: AcceptableValue) => void
  disabled?: Ref<boolean>
}

export const [injectToggleGroupRootContext, provideToggleGroupRootContext]
  = createContext<ToggleGroupRootContext>('ToggleGroupRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useSingleOrMultipleValue } from '@/shared/useSingleOrMultipleValue'

const props = withDefaults(defineProps<ToggleGroupRootProps>(), {
  disabled: false,
})
const emits = defineEmits<ToggleGroupRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current toggle values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { disabled } = toRefs(props)
const { forwardRef } = useForwardExpose()

const { modelValue, changeModelValue, isSingle } = useSingleOrMultipleValue(props, emits)

provideToggleGroupRootContext({
  isSingle,
  modelValue,
  changeModelValue,
  disabled,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
  >
    <slot :model-value="modelValue" />
  </Primitive>
</template>
