<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface CheckboxIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
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
  <!-- Plain v-if, not <Presence>: the indicator never binds the animation
       handlers, so Presence only ever unmounted it via its 24-frame watchdog —
       the check glyph lingered until the next interaction. -->
  <Primitive
    v-if="isIndeterminate(rootContext.state.value) || rootContext.state.value === true"
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
</template>
