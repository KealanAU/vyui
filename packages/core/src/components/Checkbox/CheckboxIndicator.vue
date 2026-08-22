<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface CheckboxIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Presence } from '@/components/Presence'
import { Primitive } from '@/components/Primitive'
import { injectCheckboxRootContext } from './CheckboxRoot.vue'
import { getState, isIndeterminate } from './utils'

withDefaults(defineProps<CheckboxIndicatorProps>(), {
  as: 'view',
})
const { forwardRef } = useForwardExpose()

const rootContext = injectCheckboxRootContext()
</script>

<template>
  <Presence
    :show="isIndeterminate(rootContext.state.value) || rootContext.state.value === true"
  >
    <Primitive
      :ref="forwardRef"
      :data-state="getState(rootContext.state.value)"
      :data-disabled="rootContext.disabled.value ? '' : undefined"
      :style="{ pointerEvents: 'none' }"
      :as-child="asChild"
      :as="as"
      v-bind="$attrs"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
