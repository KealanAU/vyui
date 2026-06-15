<script setup lang="ts">
import { computed, ref } from 'vue'

import { SwiperItem, SwiperRoot } from '..'

const props = defineProps<{
  defaultValue?: number
  itemWidth?: number
  itemCount?: number
  disabled?: boolean
  loop?: boolean
  autoplay?: boolean
  interval?: number
  axisLock?: boolean
  spaceBetween?: number
  align?: 'start' | 'center' | 'end'
  containerWidth?: number
  offsetLimit?: [number, number]
  rtl?: boolean
}>()

const itemWidth = computed(() => props.itemWidth ?? 300)
const itemCount = computed(() => props.itemCount ?? 4)
const items = computed(() =>
  Array.from({ length: itemCount.value }, (_, i) => ({ id: i, label: `Slide ${i + 1}` })),
)

const current = ref(props.defaultValue ?? 0)
</script>

<template>
  <view>
    <SwiperRoot
      v-model="current"
      :item-width="itemWidth"
      :item-count="itemCount"
      :disabled="disabled"
      :loop="loop"
      :autoplay="autoplay"
      :interval="interval"
      :axis-lock="axisLock"
      :space-between="spaceBetween"
      :align="align"
      :container-width="containerWidth"
      :offset-limit="offsetLimit"
      :rtl="rtl"
      data-testid="swiper-root"
    >
      <SwiperItem
        v-for="item in items"
        :key="item.id"
        :data-testid="`item-${item.id}`"
      >
        <text>{{ item.label }}</text>
      </SwiperItem>
    </SwiperRoot>
    <text data-testid="index">{{ current }}</text>
  </view>
</template>
