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
import { useA11y } from '@/shared/composables'
import { injectDropdownMenuSubContext } from './DropdownMenuSub.vue'

const props = withDefaults(defineProps<DropdownMenuSubTriggerProps>(), {
  as: 'view',
})

const subContext = injectDropdownMenuSubContext()

const a11y = useA11y(() => ({
  role: 'button',
  disabled: props.disabled,
  state: subContext.open.value ? 'expanded' : 'collapsed',
}))
</script>

<template>
  <Primitive
    :as="as"
    :data-state="subContext.open.value ? 'open' : 'closed'"
    :data-disabled="disabled ? '' : undefined"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="!disabled && subContext.onOpenToggle()"
  >
    <slot />
  </Primitive>
</template>
