<script setup lang="ts">
// Rotating loading spinner. Wraps a (non-masked, Lynx-renderable) Icon Park
// loading glyph in a view carrying the `.vyui-spin` keyframe (defined in
// index.css — the Lynx tailwind preset has no `animate-spin`).
import { Icon as VyIcon } from '@vyui/core'

withDefaults(defineProps<{ size?: number, color?: string }>(), {
  size: 20,
  color: '#94a3b8',
})
</script>

<template>
  <view class="vyui-spin flex items-center justify-center">
    <VyIcon name="icon-park-outline:loading-four" :size="size" :color="color" />
  </view>
</template>
