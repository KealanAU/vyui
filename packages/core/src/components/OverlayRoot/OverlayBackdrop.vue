<script lang="ts">
export interface OverlayBackdropProps {
  /**
   * Style merged onto the full-screen backdrop wrapper — typically used by
   * modal overlays to dim the screen behind the painted content.
   */
  backdropStyle?: Record<string, any>
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { VyStyle } from '@/shared/types'

/**
 * Full-screen wrapper for any overlay registered through the OverlayRoot portal.
 * Centers its single child and (optionally) dims the screen.
 *
 * `OverlayRoot` renders portalled entries directly, with no shared absolute
 * wrapper (see `OverlayRoot.vue` for why one would swallow touches in empty
 * regions), so every modal overlay owns its full-screen sizing —
 * `width/height: 100%` is not enough when the entry is laid out as a flex
 * sibling of the app content. Centralising the `position: fixed` rectangle here
 * keeps that contract in one place.
 *
 * Fall-through `@tap` is the dismissal hook; AlertDialog deliberately omits it.
 */
const props = defineProps<OverlayBackdropProps>()
defineOptions({ inheritAttrs: true })

const attrs = useAttrs()

// Default to flex-centering the single child so overlays without their own
// anchor coords land in the middle of the screen rather than the top-left.
// Callers needing a different dock override via `backdropStyle` or `style`.
const mergedStyle = computed<VyStyle>(() => ({
  position: 'fixed',
// Lynx web gives every element `position: relative`, so `z-index: auto` overlays
// paint in DOM order and an `OverlayRoot` mounted first would land behind the
// app content. Matches the Sheet backdrop's 1000; ToastViewport sits at 1100.
  zIndex: 1000,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  ...(attrs.style as Record<string, any> | undefined),
  ...props.backdropStyle,
}))
</script>

<template>
  <view :style="mergedStyle">
    <slot />
  </view>
</template>
