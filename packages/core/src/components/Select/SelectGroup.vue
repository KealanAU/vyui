<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { createContext } from '@/shared'

export interface SelectGroupProps extends PrimitiveProps {}

export interface SelectGroupContext {
  id: string
}

export const [injectSelectGroupContext, provideSelectGroupContext]
  = createContext<SelectGroupContext>('SelectGroup')
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { useId } from '@/shared'

withDefaults(defineProps<SelectGroupProps>(), {
  as: 'view',
})

const groupId = useId(undefined, 'vy-select-group')

provideSelectGroupContext({ id: groupId })
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
