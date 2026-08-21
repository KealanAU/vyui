<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import type { FormFieldProps } from '@/shared/types'
import { createContext, useForwardExpose } from '@/shared'

export interface SwitchRootProps<T = boolean> extends PrimitiveProps, FormFieldProps {
  /** The state of the switch when it is initially rendered. Use when you do not need to control its state. */
  defaultValue?: T
  /** The controlled state of the switch. Can be bind as `v-model`. */
  modelValue?: T | null
  /** When `true`, prevents the user from interacting with the switch. */
  disabled?: boolean
  id?: string
  /** The value given as data when submitted with a `name`. */
  value?: string
  /** The value used when the switch is on. Defaults to `true`. */
  trueValue?: T
  /** The value used when the switch is off. Defaults to `false`. */
  falseValue?: T
}

export type SwitchRootEmits<T = boolean> = {
  /** Event handler called when the value of the switch changes. */
  'update:modelValue': [payload: T]
}

export interface SwitchRootContext {
  checked: ComputedRef<boolean>
  toggleCheck: () => void
  disabled: Ref<boolean>
}

export const [injectSwitchRootContext, provideSwitchRootContext]
  = createContext<SwitchRootContext>('SwitchRoot')
</script>

<script setup lang="ts" generic="T = boolean">
import { computed, toRefs, useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y, useStandardVModel } from '@/shared/composables'

const props = withDefaults(defineProps<SwitchRootProps<T>>(), {
  as: 'view',
  modelValue: undefined,
  value: 'on',
  trueValue: (() => true) as unknown as undefined,
  falseValue: (() => false) as unknown as undefined,
})
const emit = defineEmits<SwitchRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Whether the switch is checked */
    checked: typeof checked.value
  }) => any
}>()

const { disabled } = toRefs(props)

const modelValue = useStandardVModel<T>(props as any, emit as any, props.falseValue as T)

const checked = computed(() => modelValue.value === props.trueValue)

function toggleCheck() {
  if (disabled.value)
    return

  modelValue.value = checked.value ? props.falseValue as T : props.trueValue as T
}

const { forwardRef } = useForwardExpose()

provideSwitchRootContext({
  checked,
  toggleCheck,
  disabled,
})

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'switch',
  disabled: disabled.value,
  state: checked.value ? 'on' : 'off',
  label: attrs['accessibility-label'] as string | undefined,
}))
</script>

<template>
  <Primitive
    v-bind="{ ...$attrs, ...a11y }"
    :id="id"
    :ref="forwardRef"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
    :as-child="asChild"
    :as="as"
    :disabled="disabled"
    @tap="toggleCheck"
  >
    <slot
      :model-value="modelValue"
      :checked="checked"
    />

  </Primitive>
</template>
