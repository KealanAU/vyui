<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface DialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<DialogTitleProps>(), {
  as: 'text',
})

useForwardExpose()
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    accessibility-traits="header"
  >
    <slot />
  </Primitive>
</template>
