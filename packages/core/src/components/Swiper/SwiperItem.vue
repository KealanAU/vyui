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
</script>

<template>
  <view
    class="vyui-swiper__item"
    data-vyui-swiper-item
    :style="{ width: `${width}px`, flexShrink: 0 }"
  >
    <slot />
  </view>
</template>
