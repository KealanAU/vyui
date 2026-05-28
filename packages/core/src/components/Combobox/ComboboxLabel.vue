<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface ComboboxLabelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useId } from '@/shared'
import { injectComboboxGroupContext } from './ComboboxGroup.vue'

withDefaults(defineProps<ComboboxLabelProps>(), {
  as: 'text',
})

const groupContext = injectComboboxGroupContext(null)
const labelId = useId(undefined, 'vy-combobox-group-label')
if (groupContext)
  groupContext.labelId.value = labelId
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :id="labelId"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
