<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { createContext } from '@/shared'

export interface ComboboxGroupProps extends PrimitiveProps {}

export interface ComboboxGroupContext {
  id: string
  labelId: { value: string }
}

export const [injectComboboxGroupContext, provideComboboxGroupContext]
  = createContext<ComboboxGroupContext>('ComboboxGroup')
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useId } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

withDefaults(defineProps<ComboboxGroupProps>(), {
  as: 'view',
})

const id = useId(undefined, 'vy-combobox-group')
const rootContext = injectComboboxRootContext()

provideComboboxGroupContext({ id, labelId: { value: '' } })

// The group container always renders; individual ComboboxItems self-filter via
// their own `isRender`. ComboboxEmpty surfaces the "no matches" message.

onMounted(() => {
  if (!rootContext.allGroups.value.has(id))
    rootContext.allGroups.value.set(id, new Set())
})

onUnmounted(() => {
  rootContext.allGroups.value.delete(id)
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    data-combobox-group=""
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
