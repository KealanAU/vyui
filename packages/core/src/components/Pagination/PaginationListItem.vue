<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface PaginationListItemProps extends PrimitiveProps {
  /** Value for the page */
  value: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectPaginationRootContext } from './PaginationRoot.vue'

const props = withDefaults(defineProps<PaginationListItemProps>(), { as: 'view' })
useForwardExpose()

const rootContext = injectPaginationRootContext()
const isSelected = computed(() => rootContext.page.value === props.value)

const disabled = computed((): boolean => rootContext.disabled.value)
</script>

<template>
  <Primitive
    v-bind="props"
    data-type="page"
    :accessibility-label="`Page ${value}`"
    :data-selected="isSelected ? 'true' : undefined"
    :disabled
    @tap="!disabled && rootContext.onPageChange(value)"
  >
    <slot>{{ value }}</slot>
  </Primitive>
</template>
