<script lang="ts">
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuSubTriggerProps {
  as?: AsTag
  /** When `true`, prevents the user from interacting with the trigger. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectDropdownMenuSubContext } from './DropdownMenuSub.vue'

const props = withDefaults(defineProps<DropdownMenuSubTriggerProps>(), {
  as: 'view',
})

const subContext = injectDropdownMenuSubContext()
</script>

<template>
  <Primitive
    :as="as"
    :accessibility-traits="disabled ? 'disabled' : 'button'"
    :data-state="subContext.open.value ? 'open' : 'closed'"
    :data-disabled="disabled ? '' : undefined"
    v-bind="$attrs"
    @tap="!disabled && subContext.onOpenToggle()"
  >
    <slot />
  </Primitive>
</template>
