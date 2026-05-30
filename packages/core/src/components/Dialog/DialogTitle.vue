<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface DialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'

const props = withDefaults(defineProps<DialogTitleProps>(), {
  as: 'text',
})

useForwardExpose()

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'heading',
  label: attrs['accessibility-label'] as string | undefined,
}))
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    v-bind="a11y"
  >
    <slot />
  </Primitive>
</template>
