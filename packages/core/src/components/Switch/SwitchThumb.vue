<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface SwitchThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'
import { injectSwitchRootContext } from './SwitchRoot.vue'

withDefaults(defineProps<SwitchThumbProps>(), { as: 'view' })

const rootContext = injectSwitchRootContext()

useForwardExpose()
</script>

<template>
  <Primitive
    :data-state="rootContext.checked.value ? 'checked' : 'unchecked'"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    :as-child="asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
