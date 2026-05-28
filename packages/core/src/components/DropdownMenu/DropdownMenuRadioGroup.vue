<script lang="ts">
import type { Ref } from 'vue'
import type { AsTag } from '@/components/Primitive'
import { createContext } from '@/shared'

export interface DropdownMenuRadioGroupProps {
  as?: AsTag
  /** The value of the selected radio item. */
  modelValue?: string
}

export type DropdownMenuRadioGroupEmits = {
  'update:modelValue': [value: string]
}

export interface DropdownMenuRadioGroupContext {
  modelValue: Ref<string | undefined>
  onValueChange: (value: string) => void
}

export const [injectDropdownMenuRadioGroupContext, provideDropdownMenuRadioGroupContext]
  = createContext<DropdownMenuRadioGroupContext>('DropdownMenuRadioGroup')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<DropdownMenuRadioGroupProps>(), {
  as: 'view',
})

const emit = defineEmits<DropdownMenuRadioGroupEmits>()

const modelValue = useVModel(props, 'modelValue', emit, { passive: true }) as Ref<string | undefined>

provideDropdownMenuRadioGroupContext({
  modelValue,
  onValueChange: (value: string) => {
    modelValue.value = value
  },
})
</script>

<template>
  <Primitive
    :as="as"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
