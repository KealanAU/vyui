<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0. -->
<script lang="ts">
export interface SwiperRootProps {
  modelValue?: number
  defaultValue?: number
  itemWidth: number
  itemCount: number
  /** Fraction of the snap unit dragged past which the snap rounds up. */
  threshold?: number
  /** px/s flick above which a release advances by one item. */
  velocityThreshold?: number
  /** Snap animation duration in ms. */
  duration?: number
  disabled?: boolean
  /**
   * Navigate circularly: dragging/autoplay past the last item wraps to the
   * first SEAMLESSLY — edge slides are cloned so motion continues across the
   * seam. When false, the track clamps at the ends.
   */
  loop?: boolean
  /** Alias for `loop` — matches lynx-ui's `circular` naming. `loop` wins. */
  circular?: boolean
  /** Only consume gestures that are predominantly horizontal (±45°); a vertical
   *  drag is released to the host scroll surface. Mirrors lynx-ui's
   *  `experimentalHorizontalSwipeOnly`. */
  axisLock?: boolean
  /** Auto-advance through items on an interval. Pauses while dragging. */
  autoplay?: boolean
  /** Autoplay step interval in ms (time an item is shown before advancing). */
  interval?: number
  /** Gap between adjacent items, px — the snap unit becomes
   *  `itemWidth + spaceBetween`. Mirrors lynx-ui `modeConfig.spaceBetween`. */
  spaceBetween?: number
  /** Layout mode. `'normal'` (default) is the standard paged carousel;
   *  `'carousel'` is a forward-compat alias treated as normal. */
  mode?: 'normal' | 'carousel'
  /** Active-item alignment when the viewport is wider than an item: `'start'`
   *  (default) | `'center'` | `'end'`. Requires `containerWidth`. */
  align?: 'start' | 'center' | 'end'
  /** Viewport width, px — needed for `align: center/end` and the end clamp. */
  containerWidth?: number
  /** Explicit `[startLimit, endLimit]` non-loop offset clamp, px past each edge
   *  the track may rest. Mirrors lynx-ui `offsetLimit`. */
  offsetLimit?: [number, number]
  /** Right-to-left layout. A forward swipe moves visually rightward. */
  rtl?: boolean
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
  spaceBetween: 0,
  mode: 'normal',
  align: 'start',
  containerWidth: 0,
  rtl: false,
})

const emits = defineEmits<SwiperRootEmits>()

const currentIndex = useStandardVModel<number>(props, emits, 0)

const itemWidth = computed(() => props.itemWidth)
const itemCount = computed(() => props.itemCount)
const spaceBetween = computed(() => props.spaceBetween)
const rtl = computed(() => props.rtl)
// `circular` is the lynx-ui alias; either prop enables looping.
const loop = computed(() => props.loop || props.circular)

// Snap unit (item + gap) — the period one clone copy spans.
const fullSize = computed(() => props.itemWidth + props.spaceBetween)
const totalWidth = computed(() => fullSize.value * props.itemCount)

// First-screen track style, used before the MT takes over transforms. In loop
// mode the track holds three copies of the slot (prev | main | next), widened to
// fit and pulled left by one period so the MAIN copy's item 0 sits at
// translateX(0) — the duplicated edges are what make the seam seamless.
const trackStyle = computed(() => {
  const base: Record<string, string | number> = {
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
  }
  if (loop.value) {
    base.width = `${totalWidth.value * 3}px`
    base.left = `${-totalWidth.value}px`
  }
  return base
})

// All drag plumbing lives in the shared controller; this component wires its
// config + the track.
const {
  containerRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  setIndex,
} = useDragGesture({
  currentIndex,
  itemWidth: () => props.itemWidth,
  itemCount: () => props.itemCount,
  spaceBetween: () => props.spaceBetween,
  align: () => props.align,
  containerWidth: () => props.containerWidth,
  offsetLimit: () => props.offsetLimit,
  rtl: () => props.rtl,
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
  spaceBetween,
  loop,
  rtl,
  setIndex,
})
</script>

<template>
  <view
    class="vyui-swiper"
    data-vyui-swiper-root
    :style="{
      overflow: 'hidden',
      position: 'relative',
      direction: rtl ? 'rtl' : 'ltr',
    }"
  >
    <view
      class="vyui-swiper__track"
      :main-thread-ref="containerRef"
      :main-thread-bindtouchstart="onTouchStart"
      :main-thread-bindtouchmove="onTouchMove"
      :main-thread-bindtouchend="onTouchEnd"
      :main-thread-bindtouchcancel="onTouchEnd"
      :main-thread-bindmousedown="onMouseDown"
      :main-thread-bindmousemove="onMouseMove"
      :main-thread-bindmouseup="onMouseUp"
      :style="trackStyle"
    >
      <!-- Loop: leading clone copy (the slides BEFORE the seam). -->
      <view
        v-if="loop"
        data-vyui-swiper-clone="leading"
        :style="{ display: 'flex', flexDirection: 'row', flexShrink: 0 }"
      >
        <slot />
      </view>
      <view :style="{ display: 'flex', flexDirection: 'row', flexShrink: 0 }">
        <slot />
      </view>
      <!-- Loop: trailing clone copy (the slides AFTER the seam). -->
      <view
        v-if="loop"
        data-vyui-swiper-clone="trailing"
        :style="{ display: 'flex', flexDirection: 'row', flexShrink: 0 }"
      >
        <slot />
      </view>
    </view>
    <!-- Overlay content (e.g. indicators) lives outside the track so the drag
         transform doesn't move it. -->
    <slot name="overlay" />
  </view>
</template>
