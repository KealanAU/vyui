<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/components/Primitive'
import { createContext } from '@/shared'
import { useStandardVModel } from '@/shared/composables'

export interface CheckboxGroupRootProps<T = AcceptableValue> extends PrimitiveProps, FormFieldProps {
  /** The value of the checkbox when it is initially rendered. Use when you do not need to control its value. */
  defaultValue?: T[]
  /** The controlled value of the checkbox. Can be binded with v-model. */
  modelValue?: T[]
  /** When `true`, prevents the user from interacting with the checkboxes */
  disabled?: boolean
}

export type CheckboxGroupRootEmits<T = AcceptableValue> = {
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: T[]]
}

interface CheckboxGroupRootContext {
  modelValue: Ref<AcceptableValue[]>
  disabled: Ref<boolean>
}

export const [injectCheckboxGroupRootContext, provideCheckboxGroupRootContext]
  = createContext<CheckboxGroupRootContext>('CheckboxGroupRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
const props = defineProps<CheckboxGroupRootProps<T>>()
const emits = defineEmits<CheckboxGroupRootEmits<T>>()

const { disabled } = toRefs(props)

const { primitiveElement } = usePrimitiveElement()

const modelValue = useStandardVModel<T[]>(props, emits, [])

provideCheckboxGroupRootContext({
  modelValue,
  disabled,
})
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
