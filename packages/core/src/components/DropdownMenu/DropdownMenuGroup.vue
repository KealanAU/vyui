<script lang="ts">
import type { AsTag } from '@/components/Primitive'

export interface DropdownMenuGroupProps {
  as?: AsTag
}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<DropdownMenuGroupProps>(), {
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
