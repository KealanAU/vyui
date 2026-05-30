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
import { useA11y } from '@/shared/composables'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'

const props = withDefaults(defineProps<DropdownMenuTriggerProps>(), {
  as: 'view',
})

const rootContext = injectDropdownMenuRootContext()

const a11y = useA11y(() => ({
  role: 'button',
  disabled: props.disabled,
  state: rootContext.open.value ? 'expanded' : 'collapsed',
}))
</script>

<template>
  <Primitive
    :as="as"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-disabled="disabled ? '' : undefined"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="!disabled && rootContext.onOpenToggle()"
  >
    <slot />
  </Primitive>
</template>
