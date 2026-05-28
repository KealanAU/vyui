<script lang="ts">
import type { Ref } from 'vue'
import { createContext } from '@/shared'

export interface SelectRootProps {
  /** The controlled value of the Select. Can be bound as `v-model`. */
  modelValue?: string
  /** The value of the select when initially rendered. */
  defaultValue?: string
  /** The controlled open state of the Select. Can be bound as `v-model:open`. */
  open?: boolean
  /** The open state of the select when it is initially rendered. */
  defaultOpen?: boolean
  /** When `true`, prevents the user from interacting with Select */
  disabled?: boolean
  /** The name of the select for form submission. */
  name?: string
}

export type SelectRootEmits = {
  'update:modelValue': [value: string]
  'update:open': [value: boolean]
}

export interface SelectRootContext {
  modelValue: Ref<string | undefined>
  open: Ref<boolean>
  onOpenChange: (v: boolean) => void
  onValueChange: (v: string) => void
  itemLabels: Ref<Map<string, string>>
  onItemRegister: (value: string, label: string) => void
  onItemUnregister: (value: string) => void
  disabled: Ref<boolean>
}

export const [injectSelectRootContext, provideSelectRootContext]
  = createContext<SelectRootContext>('SelectRoot')
</script>

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { useStandardVModel, useStandardVModelOf } from '@/shared/composables'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectRootProps>(), {
  modelValue: undefined,
  open: undefined,
  disabled: false,
})

const emits = defineEmits<SelectRootEmits>()

defineSlots<{
  default?: (props: {
    modelValue: typeof modelValue.value
    open: typeof open.value
  }) => any
}>()

const { disabled } = toRefs(props)

const modelValue = useStandardVModel<string | undefined>(props, emits)

const open = useStandardVModelOf<boolean>(props, 'open', emits, false)

const itemLabels = ref<Map<string, string>>(new Map())

provideSelectRootContext({
  modelValue,
  open,
  onOpenChange: (v) => {
    open.value = v
  },
  onValueChange: (v) => {
    modelValue.value = v
    open.value = false
  },
  itemLabels,
  onItemRegister: (value, label) => {
    itemLabels.value = new Map(itemLabels.value).set(value, label)
  },
  onItemUnregister: (value) => {
    const next = new Map(itemLabels.value)
    next.delete(value)
    itemLabels.value = next
  },
  disabled,
})
</script>

<template>
  <slot
    :model-value="modelValue"
    :open="open"
  />
</template>
