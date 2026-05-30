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
import { useA11y } from '@/shared/composables'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'

const props = withDefaults(defineProps<DropdownMenuItemProps>(), {
  as: 'view',
})

const emit = defineEmits<DropdownMenuItemEmits>()

const rootContext = injectDropdownMenuRootContext()

const a11y = useA11y(() => ({
  role: 'menuitem',
  disabled: props.disabled,
}))

function handleSelect() {
  emit('select')
  rootContext.onOpenChange(false)
}
</script>

<template>
  <Primitive
    :as="as"
    :data-disabled="disabled ? '' : undefined"
    :data-value="textValue"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="!disabled && handleSelect()"
  >
    <slot />
  </Primitive>
</template>
