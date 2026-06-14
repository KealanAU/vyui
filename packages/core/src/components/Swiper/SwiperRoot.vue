<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0. -->
<script lang="ts">
export interface SwiperRootProps {
  modelValue?: number
  defaultValue?: number
  itemWidth: number
  itemCount: number
  /** Fraction of itemWidth dragged past which the snap rounds up. */
  threshold?: number
  /** px/s flick above which a release advances by one item. */
  velocityThreshold?: number
  /** Snap animation duration in ms. */
  duration?: number
  disabled?: boolean
  /**
   * Navigate circularly: dragging/autoplay past the last item wraps to the
   * first (and vice-versa). When false, the track clamps at the ends.
   */
  loop?: boolean
  /** Alias for `loop` — matches lynx-ui's `circular` naming. `loop` wins. */
  circular?: boolean
  /**
   * Only consume gestures that are predominantly horizontal (±45°). A
   * vertical drag is released to the host scroll surface. Mirrors lynx-ui's
   * `experimentalHorizontalSwipeOnly`.
   */
  axisLock?: boolean
  /** Auto-advance through items on an interval. Pauses while dragging. */
  autoplay?: boolean
  /** Autoplay step interval in ms (time an item is shown before advancing). */
  interval?: number
}

export type SwiperRootEmits = {
  'update:modelValue': [value: number]
  swipeStart: []
  swipeEnd: [value: number]
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

import { useStandardVModel } from '@/shared/composables'
import { useDragGesture } from '@/shared/gesture/useDragGesture'

import { provideSwiperRootContext } from './swiperContext'

const props = withDefaults(defineProps<SwiperRootProps>(), {
  threshold: 0.3,
  velocityThreshold: 300,
  duration: 300,
  disabled: false,
  loop: false,
  circular: false,
  axisLock: false,
  autoplay: false,
  interval: 3000,
})

const emits = defineEmits<SwiperRootEmits>()

const currentIndex = useStandardVModel<number>(props, emits, 0)

const itemWidth = computed(() => props.itemWidth)
const itemCount = computed(() => props.itemCount)
// `circular` is the lynx-ui alias; either prop enables looping.
const loop = computed(() => props.loop || props.circular)

// All drag plumbing (MT refs, velocity, snap animation, axis lock, autoplay,
// MT↔BG hops) lives in the shared controller; this component just wires its
// config + the track.
const { containerRef, onTouchStart, onTouchMove, onTouchEnd, setIndex } = useDragGesture({
  currentIndex,
  itemWidth: () => props.itemWidth,
  itemCount: () => props.itemCount,
  duration: () => props.duration,
  threshold: () => props.threshold,
  velocityThreshold: () => props.velocityThreshold,
  disabled: () => props.disabled,
  loop: () => loop.value,
  axisLock: () => props.axisLock,
  autoplay: () => props.autoplay,
  interval: () => props.interval,
  onSwipeStart: () => emits('swipeStart'),
  onSwipeEnd: index => emits('swipeEnd', index),
})

defineExpose({ setIndex })

provideSwiperRootContext({
  currentIndex,
  itemCount,
  itemWidth,
  loop,
  setIndex,
})
</script>

<template>
  <view class="vyui-swiper" data-vyui-swiper-root :style="{ overflow: 'hidden', position: 'relative' }">
    <view
      class="vyui-swiper__track"
      :main-thread-ref="containerRef"
      :main-thread-bindtouchstart="onTouchStart"
      :main-thread-bindtouchmove="onTouchMove"
      :main-thread-bindtouchend="onTouchEnd"
      :main-thread-bindtouchcancel="onTouchEnd"
      :style="{ display: 'flex', flexDirection: 'row' }"
    >
      <slot />
    </view>
    <!-- Overlay content (e.g. indicators) lives outside the track so the
         track's drag transform doesn't drag it along — it stays fixed. -->
    <slot name="overlay" />
  </view>
</template>
