<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'

export interface StepperTitleProps extends PrimitiveProps { }

const props = withDefaults(defineProps<StepperTitleProps>(), { as: 'text' })
const itemContext = injectStepperItemContext()
useForwardExpose()

const a11y = useA11y(() => ({ role: 'heading' }))
</script>

<template>
  <Primitive
    v-bind="{ ...props, ...a11y }"
    :id="itemContext.titleId"
  >
    <slot />
  </Primitive>
</template>
