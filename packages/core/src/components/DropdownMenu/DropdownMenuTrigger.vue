<script lang="ts">
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuTriggerProps {
  as?: AsTag
  /** When `true`, prevents the user from interacting with the trigger. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'

const props = withDefaults(defineProps<DropdownMenuTriggerProps>(), {
  as: 'view',
})

const rootContext = injectDropdownMenuRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :accessibility-traits="disabled ? 'disabled' : 'button'"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-disabled="disabled ? '' : undefined"
    v-bind="$attrs"
    @tap="!disabled && rootContext.onOpenToggle()"
  >
    <slot />
  </Primitive>
</template>
