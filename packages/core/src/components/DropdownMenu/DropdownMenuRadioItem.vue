<script lang="ts">
import type { ComputedRef } from 'vue'
import type { AsTag } from '@/components/Primitive'
import { createContext } from '@/shared'

export interface DropdownMenuRadioItemProps {
  as?: AsTag
  /** The value of the radio item. */
  value: string
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
}

export type DropdownMenuRadioItemEmits = {
  select: []
}

export interface DropdownMenuRadioItemContext {
  isChecked: ComputedRef<boolean>
}

export const [injectDropdownMenuRadioItemContext, provideDropdownMenuRadioItemContext]
  = createContext<DropdownMenuRadioItemContext>('DropdownMenuRadioItem')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectDropdownMenuRadioGroupContext } from './DropdownMenuRadioGroup.vue'

const props = withDefaults(defineProps<DropdownMenuRadioItemProps>(), {
  as: 'view',
})

const emit = defineEmits<DropdownMenuRadioItemEmits>()

const radioGroupContext = injectDropdownMenuRadioGroupContext()

const isChecked = computed(() => radioGroupContext.modelValue.value === props.value)

provideDropdownMenuRadioItemContext({ isChecked })

function handleTap() {
  if (props.disabled)
    return
  radioGroupContext.onValueChange(props.value)
  emit('select')
}
</script>

<template>
  <Primitive
    :as="as"
    :accessibility-traits="disabled ? 'disabled' : 'button'"
    :data-state="isChecked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
    v-bind="$attrs"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
