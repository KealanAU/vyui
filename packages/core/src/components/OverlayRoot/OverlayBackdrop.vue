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
 * Full-screen wrapper for any overlay registered through the OverlayRoot
 * portal. Centers its single child and (optionally) dims the screen.
 *
 * Why this exists: `OverlayRoot` renders portalled entries directly (no shared
 * absolute wrapper — see the comment in `OverlayRoot.vue` for why a wrapper
 * would swallow touches in empty regions). That makes every modal overlay
 * responsible for its own full-screen sizing — `width/height: 100%` is not
 * enough because the entry is laid out as a flex sibling of the app content.
 * Centralising the `position: fixed` rectangle here keeps the contract in one
 * place: any future modal overlay just wraps its content in `<OverlayBackdrop>`.
 *
 * Fall-through `@tap` is the dismissal hook (Dialog/Popover modal); AlertDialog
 * deliberately omits it.
 */
const props = defineProps<OverlayBackdropProps>()
defineOptions({ inheritAttrs: true })

const attrs = useAttrs()

// Default to flex-centering the single child so overlays without their own
// `position: fixed` + anchor coords (Popover, DropdownMenu,
// Select/Combobox content panels) land in the middle of the screen instead of
// docking to the top-left. Callers that need a different dock (ActionSheet's
// bottom sheet, Dialog if it ever wants a custom anchor) override via
// `backdropStyle` or `style` — both spread after the defaults below.
const mergedStyle = computed<VyStyle>(() => ({
  position: 'fixed',
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
