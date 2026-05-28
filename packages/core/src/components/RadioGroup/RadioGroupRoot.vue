<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import type { AcceptableValue, DataOrientation, Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useForwardExpose } from '@/shared'

export interface RadioGroupRootProps extends PrimitiveProps, FormFieldProps {
  /** The controlled value of the radio item to check. Can be binded as `v-model`. */
  modelValue?: AcceptableValue
  /**
   * The value of the radio item that should be checked when initially rendered.
   *
   * Use when you do not need to control the state of the radio items.
   */
  defaultValue?: AcceptableValue
  /** When `true`, prevents the user from interacting with radio items. */
  disabled?: boolean
  /** The orientation of the component. */
  orientation?: DataOrientation
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, keyboard navigation will loop from last item to first, and vice versa. */
  loop?: boolean
}
export type RadioGroupRootEmits = {
  /** Event handler called when the radio group value changes */
  'update:modelValue': [payload: AcceptableValue]
}

interface RadioGroupRootContext {
  modelValue?: Readonly<Ref<AcceptableValue | undefined>>
  changeModelValue: (value?: AcceptableValue) => void
  disabled: Ref<boolean>
  loop: Ref<boolean>
  orientation: Ref<DataOrientation | undefined>
  name?: string
  required: Ref<boolean>
}

export const [injectRadioGroupRootContext, provideRadioGroupRootContext]
  = createContext<RadioGroupRootContext>('RadioGroupRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useStandardVModel } from '@/shared/composables'

const props = withDefaults(defineProps<RadioGroupRootProps>(), {
  disabled: false,
  required: false,
  orientation: undefined,
  loop: true,
})

const emits = defineEmits<RadioGroupRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { forwardRef } = useForwardExpose()
const modelValue = useStandardVModel<AcceptableValue | undefined>(props, emits)

const { disabled, loop, orientation, name, required, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

provideRadioGroupRootContext({
  modelValue,
  changeModelValue: (value) => {
    modelValue.value = value
  },
  disabled,
  loop,
  orientation,
  name: name?.value,
  required,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :data-disabled="disabled ? '' : undefined"
    :as-child="asChild"
    :as="as"
    :data-orientation="orientation"
    :dir="dir"
  >
    <slot :model-value="modelValue" />
  </Primitive>
</template>
