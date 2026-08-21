<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxCancelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

withDefaults(defineProps<ComboboxCancelProps>(), {
  as: 'view',
})

const rootContext = injectComboboxRootContext()

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'button',
  label: attrs['accessibility-label'] as string | undefined,
}))

function handleTap() {
  rootContext.filterSearch.value = ''

  if (rootContext.resetModelValueOnClear.value)
    rootContext.modelValue.value = rootContext.multiple.value ? [] : null
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="handleTap"
  >
    <slot />
  </Primitive>
</template>
