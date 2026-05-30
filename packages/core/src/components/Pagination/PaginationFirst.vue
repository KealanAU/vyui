<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface PaginationFirstProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectPaginationRootContext } from './PaginationRoot.vue'

const props = withDefaults(defineProps<PaginationFirstProps>(), { as: 'view' })

const rootContext = injectPaginationRootContext()
useForwardExpose()

const disabled = computed((): boolean => rootContext.page.value === 1 || rootContext.disabled.value)

const a11y = useA11y(() => ({
  role: 'button',
  label: 'First Page',
  disabled: disabled.value,
}))
</script>

<template>
  <Primitive
    v-bind="{ ...props, ...a11y }"
    :disabled
    @tap="!disabled && rootContext.onPageChange(1)"
  >
    <slot />
  </Primitive>
</template>
