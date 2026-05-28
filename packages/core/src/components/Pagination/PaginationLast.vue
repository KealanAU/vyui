<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface PaginationLastProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectPaginationRootContext } from './PaginationRoot.vue'

const props = withDefaults(defineProps<PaginationLastProps>(), { as: 'view' })

const rootContext = injectPaginationRootContext()
useForwardExpose()

const disabled = computed((): boolean => rootContext.page.value === rootContext.pageCount.value || rootContext.disabled.value)
</script>

<template>
  <Primitive
    v-bind="props"
    accessibility-label="Last Page"
    :disabled
    @tap="!disabled && rootContext.onPageChange(rootContext.pageCount.value)"
  >
    <slot />
  </Primitive>
</template>
