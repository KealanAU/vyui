<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<AlertDialogTitleProps>(), {
  as: 'text',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    accessibility-traits="header"
  >
    <slot />
  </Primitive>
</template>
