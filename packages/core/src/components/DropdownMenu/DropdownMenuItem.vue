<script lang="ts">
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuItemProps {
  as?: AsTag
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
  /** Optional text used for typeahead purposes. */
  textValue?: string
}

export type DropdownMenuItemEmits = {
  select: []
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'

const props = withDefaults(defineProps<DropdownMenuItemProps>(), {
  as: 'view',
})

const emit = defineEmits<DropdownMenuItemEmits>()

const rootContext = injectDropdownMenuRootContext()

function handleSelect() {
  emit('select')
  rootContext.onOpenChange(false)
}
</script>

<template>
  <Primitive
    :as="as"
    :accessibility-traits="disabled ? 'disabled' : 'button'"
    :data-disabled="disabled ? '' : undefined"
    :data-value="textValue"
    v-bind="$attrs"
    @tap="!disabled && handleSelect()"
  >
    <slot />
  </Primitive>
</template>
