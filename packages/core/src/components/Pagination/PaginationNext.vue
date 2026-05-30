<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface PaginationNextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectPaginationRootContext } from './PaginationRoot.vue'

const props = withDefaults(defineProps<PaginationNextProps>(), { as: 'view' })

useForwardExpose()
const rootContext = injectPaginationRootContext()

const disabled = computed((): boolean => rootContext.page.value === rootContext.pageCount.value || rootContext.disabled.value)

const a11y = useA11y(() => ({
  role: 'button',
  label: 'Next Page',
  disabled: disabled.value,
}))
</script>

<template>
  <Primitive
    v-bind="{ ...props, ...a11y }"
    :disabled
    @tap="!disabled && rootContext.onPageChange(rootContext.page.value + 1)"
  >
    <slot />
  </Primitive>
</template>
