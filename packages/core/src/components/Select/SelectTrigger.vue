<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SelectTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with the trigger. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectSelectRootContext } from './SelectRoot.vue'

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  as: 'view',
  disabled: false,
})

const rootContext = injectSelectRootContext()

const isDisabled = computed(() => rootContext.disabled.value || props.disabled)

const a11y = useA11y(() => ({
  role: 'button',
  disabled: isDisabled.value,
  state: rootContext.open.value ? 'expanded' : 'collapsed',
}))

function handleTap() {
  if (!isDisabled.value) {
    rootContext.onOpenChange(!rootContext.open.value)
  }
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-disabled="isDisabled ? '' : undefined"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
