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
import { computed, useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxTriggerProps>(), {
  as: 'view',
  disabled: false,
})

const rootContext = injectComboboxRootContext()

const isDisabled = computed(() => props.disabled || rootContext.disabled.value)

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'button',
  disabled: isDisabled.value,
  state: rootContext.open.value ? 'expanded' : 'collapsed',
  label: props.accessibilityLabel ?? (attrs['accessibility-label'] as string | undefined),
}))

function handleTap() {
  if (!isDisabled.value)
    rootContext.onOpenChange(!rootContext.open.value)
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-disabled="isDisabled ? '' : undefined"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
