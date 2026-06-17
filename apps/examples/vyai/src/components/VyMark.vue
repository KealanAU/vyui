<script setup lang="ts">
import { computed } from 'vue'

// The "Vy" wordmark — same glyph as the repo favicon
// (apps/docs/public/favicon.svg): bold "Vy" on a dark tile. Used as the
// assistant avatar + app logo throughout the demo. Rendered as text rather
// than the SVG so it scales crisply and needs no asset import.
const props = withDefaults(defineProps<{
  /** Tile edge length in px. */
  size?: number
  /** `circle` for avatars, `square` (rounded tile) for app-logo spots. */
  variant?: 'circle' | 'square'
  class?: any
}>(), {
  size: 28,
  variant: 'circle',
})

const radius = computed(() => props.variant === 'circle' ? '9999px' : `${Math.round(props.size * 0.28)}px`)
const fontSize = computed(() => `${Math.round(props.size * 0.5)}px`)
</script>

<template>
  <view
    :class="['bg-black flex items-center justify-center shrink-0', props.class]"
    :style="{ width: `${size}px`, height: `${size}px`, borderRadius: radius }"
  >
    <text
      class="text-white font-bold"
      :style="{ fontSize, lineHeight: fontSize, letterSpacing: '-0.5px' }"
    >Vy</text>
  </view>
</template>
