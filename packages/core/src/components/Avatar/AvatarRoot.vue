<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import { createContext } from '@/shared'

/** Load lifecycle of the avatar image, mirroring reka-ui's `ImageLoadingStatus`. */
export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface AvatarRootProps extends PrimitiveProps {}

export interface AvatarRootContext {
  /** Current image load status. `AvatarImage` writes it; `AvatarFallback` reads it. */
  imageLoadingStatus: Ref<ImageLoadingStatus>
}

export const [injectAvatarRootContext, provideAvatarRootContext]
  = createContext<AvatarRootContext>('AvatarRoot')
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

withDefaults(defineProps<AvatarRootProps>(), {
  as: 'view',
})

defineSlots<{
  default?: (props: {}) => any
}>()

useForwardExpose()

// `idle` until an `AvatarImage` mounts and begins loading. On Lynx there is no
// reliable `load` event, so `AvatarImage` optimistically flips this to `loaded`
// and only downgrades to `error` when the native `binderror` (`@error`) fires.
const imageLoadingStatus = ref<ImageLoadingStatus>('idle')

provideAvatarRootContext({ imageLoadingStatus })
</script>

<template>
  <Primitive :as="as" :as-child="asChild">
    <slot />
  </Primitive>
</template>
