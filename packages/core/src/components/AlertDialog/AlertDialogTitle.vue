<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AlertDialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'

const props = withDefaults(defineProps<AlertDialogTitleProps>(), {
  as: 'text',
})

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'heading',
  label: attrs['accessibility-label'] as string | undefined,
}))
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    v-bind="a11y"
  >
    <slot />
  </Primitive>
</template>
