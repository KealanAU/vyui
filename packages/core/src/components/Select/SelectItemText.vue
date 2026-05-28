<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SelectItemTextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectSelectItemContext } from './SelectItem.vue'

withDefaults(defineProps<SelectItemTextProps>(), {
  as: 'text',
})

const itemContext = injectSelectItemContext()
const textRef = ref<InstanceType<typeof Primitive> | null>(null)

onMounted(() => {
  // In Lynx, we can't read DOM textContent, so we rely on the slot's default text
  // being passed. We attempt to get it from the element if available, otherwise
  // the parent SelectItem will have registered with whatever was available at mount.
  // The text registration is a best-effort via the rendered element's text content.
  if (textRef.value) {
    const el = (textRef.value as any).$el ?? textRef.value
    const text = el?.textContent?.trim?.() ?? ''
    if (text) {
      itemContext.onItemTextRegister(text)
    }
  }
})
</script>

<template>
  <Primitive
    ref="textRef"
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
