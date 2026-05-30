<script lang="ts">
import type { SelectEvent } from './utils'
import type { PrimitiveProps } from '@/components/Primitive'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'

export type RadioEmits = {
  'update:checked': [value: boolean]
  'select': [SelectEvent]
}

export interface RadioProps extends PrimitiveProps, FormFieldProps {
  id?: string
  /** The value given as data when submitted with a `name`. */
  value?: AcceptableValue
  /** When `true`, prevents the user from interacting with the radio item. */
  disabled?: boolean
  checked?: boolean
  ariaLabel?: string
}
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'
import { handleSelect } from './utils'

const props = withDefaults(defineProps<RadioProps>(), {
  disabled: false,
  checked: undefined,
  as: 'view',
})
const emits = defineEmits<RadioEmits>()

defineSlots<{
  default?: (props: {
    /** Current checked state */
    checked: typeof checked.value
  }) => any
}>()

const checked = useVModel(props, 'checked', emits, {
  passive: (props.checked === undefined) as false,
})

const { value } = toRefs(props)
const { forwardRef } = useForwardExpose()

function handleClick(event: MouseEvent) {
  if (props.disabled)
    return

  handleSelect(event, props.value, (ev) => {
    emits('select', ev)
    if (ev?.defaultPrevented)
      return
    checked.value = true
  })
}

// TODO(a11y #13): rename ariaLabel prop -> accessibility-label per plan
const a11y = useA11y(() => ({
  role: 'radio',
  state: checked.value ? 'checked' : 'unchecked',
  disabled: props.disabled,
  label: props.ariaLabel,
}))
</script>

<template>
  <Primitive
    v-bind="{ ...$attrs, ...a11y }"
    :id="id"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :disabled="disabled ? '' : undefined"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
    :value="value"
    :required="required"
    :name="name"
    @tap.stop="handleClick"
  >
    <slot :checked="checked" />

  </Primitive>
</template>
