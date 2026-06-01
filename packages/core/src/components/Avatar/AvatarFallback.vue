<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AvatarFallbackProps extends PrimitiveProps {
  /**
   * Delay, in milliseconds, before the fallback is shown. Useful to avoid a
   * flash of fallback content while a fast image loads. Defaults to `0` (show
   * immediately when there is no loaded image).
   */
  delayMs?: number
}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectAvatarRootContext } from './AvatarRoot.vue'

const props = withDefaults(defineProps<AvatarFallbackProps>(), {
  as: 'view',
  delayMs: 0,
})

defineSlots<{
  default?: (props: {}) => any
}>()

const { imageLoadingStatus } = injectAvatarRootContext()
useForwardExpose()

// Gate rendering behind `delayMs`: only after the timer elapses can the
// fallback paint. With `delayMs === 0` this resolves synchronously on mount.
const canRender = ref(props.delayMs === 0)
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (props.delayMs > 0)
    timer = setTimeout(() => { canRender.value = true }, props.delayMs)
})

onUnmounted(() => {
  if (timer)
    clearTimeout(timer)
})
</script>

<template>
  <Primitive
    v-if="canRender && imageLoadingStatus !== 'loaded'"
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
