<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface NumberFieldDecrementProps extends PrimitiveProps {
  /** Multiplies the Root `step` for this button (e.g. a coarse `-10`). */
  multiplier?: number
  /** Disable this button independently of the Root. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectNumberFieldRootContext } from './NumberFieldRoot.vue'

const props = withDefaults(defineProps<NumberFieldDecrementProps>(), { as: 'view' })

const context = injectNumberFieldRootContext()
useForwardExpose()

// Strip the part-specific props so they don't leak onto the rendered element.
const primitiveProps = reactiveOmit(props, 'multiplier', 'disabled')

const disabled = computed(() =>
  props.disabled
  || context.disabled.value
  || context.readonly.value
  || context.isAtMin.value,
)

const a11y = useA11y(() => ({
  role: 'button',
  label: 'Decrease',
  disabled: disabled.value,
}))
</script>

<template>
  <Primitive
    v-bind="{ ...primitiveProps, ...a11y }"
    :disabled="disabled || undefined"
    :data-disabled="disabled ? '' : undefined"
    @tap="!disabled && context.decrement(multiplier)"
  >
    <slot />
  </Primitive>
</template>
