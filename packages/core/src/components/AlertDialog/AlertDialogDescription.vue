<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogDescriptionProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<AlertDialogDescriptionProps>(), {
  as: 'text',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
  >
    <slot />
  </Primitive>
</template>
