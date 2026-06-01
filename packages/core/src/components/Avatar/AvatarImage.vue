<script lang="ts">
import type { ImageLoadingStatus } from './AvatarRoot.vue'

export interface AvatarImageProps {
  /** Image source URL. Renders a Lynx `<image>`. */
  src?: string
}

export type AvatarImageEmits = {
  /** Fires whenever the load status transitions (`loading` → `loaded` | `error`). */
  loadingStatusChange: [status: ImageLoadingStatus]
}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { useForwardExpose } from '@/shared'
import { injectAvatarRootContext } from './AvatarRoot.vue'

const props = defineProps<AvatarImageProps>()
const emit = defineEmits<AvatarImageEmits>()

const { imageLoadingStatus } = injectAvatarRootContext()
useForwardExpose()

function setStatus(status: ImageLoadingStatus) {
  if (imageLoadingStatus.value === status)
    return
  imageLoadingStatus.value = status
  emit('loadingStatusChange', status)
}

// Lynx `<image>` has no dependable `load` event, so we optimistically treat a
// present `src` as `loaded` and only fall back to `error` when the native
// `binderror` (`@error`) fires. An absent `src` is `error` so the fallback
// shows. Re-evaluated whenever `src` changes so a fresh URL gets a new attempt.
watch(() => props.src, (src) => {
  setStatus(src ? 'loaded' : 'error')
}, { immediate: true })

function onError() {
  setStatus('error')
}
</script>

<template>
  <image
    v-if="src && imageLoadingStatus !== 'error'"
    :src="src"
    @error="onError"
  />
</template>
