<script lang="ts">
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuLabelProps {
  as?: AsTag
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<DropdownMenuLabelProps>(), {
  as: 'view',
})
</script>

<template>
  <Primitive
    :as="props.as"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
