<script lang="ts">
import type { Ref } from 'vue'
import type { AsTag } from '@/components/Primitive'
import { createContext } from '@/shared'

export interface DropdownMenuCheckboxItemProps {
  as?: AsTag
  /** The checked state of the checkbox item. Can be `true`, `false`, or `'indeterminate'`. */
  checked?: boolean | 'indeterminate'
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
}

export type DropdownMenuCheckboxItemEmits = {
  'update:checked': [value: boolean | 'indeterminate']
  select: []
}

export interface DropdownMenuCheckboxItemContext {
  checked: Ref<boolean | 'indeterminate'>
}

export const [injectDropdownMenuCheckboxItemContext, provideDropdownMenuCheckboxItemContext]
  = createContext<DropdownMenuCheckboxItemContext>('DropdownMenuCheckboxItem')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<DropdownMenuCheckboxItemProps>(), {
  as: 'view',
  checked: false,
})

const emit = defineEmits<DropdownMenuCheckboxItemEmits>()

const checked = useVModel(props, 'checked', emit, { passive: true }) as Ref<boolean | 'indeterminate'>

provideDropdownMenuCheckboxItemContext({ checked })

function handleTap() {
  if (props.disabled)
    return
  checked.value = checked.value === true ? false : true
  emit('select')
}
</script>

<template>
  <Primitive
    :as="as"
    :accessibility-traits="disabled ? 'disabled' : 'button'"
    :data-state="checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
    v-bind="$attrs"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
