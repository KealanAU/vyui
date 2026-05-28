<script lang="ts">
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuSeparatorProps {
  as?: AsTag
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<DropdownMenuSeparatorProps>(), {
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
