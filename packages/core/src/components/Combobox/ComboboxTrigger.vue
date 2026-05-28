<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with the trigger. */
  disabled?: boolean
  /** Accessibility label announced by assistive tech. Localize as needed. */
  accessibilityLabel?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxTriggerProps>(), {
  as: 'view',
  disabled: false,
})

const rootContext = injectComboboxRootContext()

const isDisabled = computed(() => props.disabled || rootContext.disabled.value)

function handleTap() {
  if (!isDisabled.value)
    rootContext.onOpenChange(!rootContext.open.value)
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    accessibility-traits="button"
    :accessibility-label="accessibilityLabel"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-disabled="isDisabled ? '' : undefined"
    :accessibility-value="rootContext.open.value ? 'expanded' : 'collapsed'"
    v-bind="$attrs"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
