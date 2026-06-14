<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0. -->
<script lang="ts">
export interface SwiperItemProps {
  /**
   * Override the item width inherited from SwiperRoot. Rare — only set when
   * an item should occupy a different track segment than the snap unit.
   */
  width?: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

import { injectSwiperRootContext } from './swiperContext'

const props = defineProps<SwiperItemProps>()

const ctx = injectSwiperRootContext()

const width = computed(() => props.width ?? ctx.itemWidth.value)
// The gap lives on the item as a trailing margin (leading in RTL) so the snap
// unit is `itemWidth + spaceBetween` and the track measures correctly. Mirrors
// lynx-ui `useFirstScreenStyle` (marginInlineEnd).
const itemStyle = computed(() => {
  const base: Record<string, string | number> = {
    width: `${width.value}px`,
    flexShrink: 0,
  }
  const gap = ctx.spaceBetween.value
  if (gap > 0) {
    if (ctx.rtl.value) base.marginLeft = `${gap}px`
    else base.marginRight = `${gap}px`
  }
  return base
})
</script>

<template>
  <view
    class="vyui-swiper__item"
    data-vyui-swiper-item
    :style="itemStyle"
  >
    <slot />
  </view>
</template>
