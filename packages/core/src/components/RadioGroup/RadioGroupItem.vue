<script lang="ts">
import type { ComputedRef } from 'vue'
import type { RadioProps } from './Radio.vue'
import type { SelectEvent } from './utils'
import { createContext, useForwardExpose } from '@/shared'

export interface RadioGroupItemProps extends Omit<RadioProps, 'checked'> {}
export type RadioGroupItemEmits = {
  select: [event: SelectEvent]
}

interface RadioGroupItemContext {
  disabled: ComputedRef<boolean>
  checked: ComputedRef<boolean>
}

export const [injectRadioGroupItemContext, provideRadiogroupItemContext]
  = createContext<RadioGroupItemContext>('RadioGroupItem')
</script>

<script setup lang="ts">
import { isEqual } from 'ohash'
import { computed } from 'vue'
import Radio from './Radio.vue'
import { injectRadioGroupRootContext } from './RadioGroupRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<RadioGroupItemProps>(), {
  disabled: false,
  as: 'view',
})

const emits = defineEmits<RadioGroupItemEmits>()

defineSlots<{
  default?: (props: {
    /** Current checked state */
    checked: typeof checked.value
    /** Required state */
    required: typeof required.value
    /** Disabled state */
    disabled: typeof disabled.value
  }) => any
}>()

const { forwardRef } = useForwardExpose()

const rootContext = injectRadioGroupRootContext()

const disabled = computed(() => rootContext.disabled.value || props.disabled)
const required = computed(() => rootContext.required.value || props.required)
const checked = computed(() => isEqual(rootContext.modelValue?.value, props.value))

provideRadiogroupItemContext({ disabled, checked })
</script>

<template>
  <Radio
    v-bind="{ ...$attrs, ...props }"
    :ref="forwardRef"
    :checked="checked"
    :required="required"
    :disabled="disabled"
    @update:checked="rootContext.changeModelValue(value)"
    @select="emits('select', $event)"
  >
    <slot
      :checked="checked"
      :required="required"
      :disabled="disabled"
    />
  </Radio>
</template>
