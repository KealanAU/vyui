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
}

export type SwiperRootEmits = {
  'update:modelValue': [value: number]
  swipeStart: []
  swipeEnd: [value: number]
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

import { useStandardVModel } from '@/shared/composables'

import { provideSwiperRootContext } from './swiperContext'

const props = withDefaults(defineProps<SwiperRootProps>(), {
  threshold: 0.3,
  velocityThreshold: 300,
  duration: 300,
  disabled: false,
})

const emits = defineEmits<SwiperRootEmits>()

const currentIndex = useStandardVModel<number>(props, emits, 0)

const itemWidth = computed(() => props.itemWidth)
const itemCount = computed(() => props.itemCount)

// --- MT refs ---------------------------------------------------------------
const containerRef = useMainThreadRef<any>(null)

const offsetRef = useMainThreadRef<number>(-(currentIndex.value ?? 0) * props.itemWidth)
const touchStartXRef = useMainThreadRef<number>(0)
const touchStartOffsetRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
const internalCommitRef = useMainThreadRef<boolean>(false)

const itemWidthRef = useMainThreadRef<number>(props.itemWidth)
const itemCountRef = useMainThreadRef<number>(props.itemCount)
const durationRef = useMainThreadRef<number>(props.duration)
const thresholdRef = useMainThreadRef<number>(props.threshold)
const velocityThresholdRef = useMainThreadRef<number>(props.velocityThreshold)
const disabledRef = useMainThreadRef<boolean>(props.disabled)

const posQueueRef = useMainThreadRef<number[]>([])
const timeQueueRef = useMainThreadRef<number[]>([])

// Animation generation counter — a worklet checks its starting generation
// against the current one each frame and bails if a newer animation began.
// This replaces storing a cancel arrow fn in a ref (which kills the
// `_workletMap` lookup for `animCancelRef.current()`).
const animGenRef = useMainThreadRef<number>(0)

// --- BG → MT sync ----------------------------------------------------------
watch(() => props.itemWidth, (v) => { itemWidthRef.current = v })
watch(() => props.itemCount, (v) => { itemCountRef.current = v })
watch(() => props.duration, (v) => { durationRef.current = v })
watch(() => props.threshold, (v) => { thresholdRef.current = v })
watch(() => props.velocityThreshold, (v) => { velocityThresholdRef.current = v })
watch(() => props.disabled, (v) => { disabledRef.current = v })

watch(currentIndex, (next, prev) => {
  if (next === prev) return
  runOnMainThread(_jumpAndAnimate as any)(next)
})

// --- Worklets (all inline; no cross-file calls, no stored worklets) -------

function _setTransform(offset: number) {
  'main thread'
  const el = containerRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateX(${offset}px)`)
  }
}

function _animateTo(to: number) {
  'main thread'
  animGenRef.current = animGenRef.current + 1
  const gen = animGenRef.current
  const from = offsetRef.current
  const ms = durationRef.current
  if (ms <= 0 || from === to) {
    offsetRef.current = to
    _setTransform(to)
    return
  }
  let startTs = 0
  // Plain nested function — runs inside the outer worklet's closure, no
  // own `_wkltId`. Mirrors lynx-ui's `useAnimate` pattern (no directive
  // on inner functions; only the outer scope is the worklet).
  function step(ts: number) {
    if (gen !== animGenRef.current) return
    if (!startTs) startTs = Number(ts)
    let elapsed = Number(ts) - startTs
    if (elapsed < 0) elapsed = 0
    let progress = elapsed / ms
    if (progress > 1) progress = 1
    const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress)
    const value = from + (to - from) * eased
    offsetRef.current = value
    const el = containerRef as unknown as {
      current?: { setStyleProperty?(k: string, v: string): void }
    }
    if (el.current?.setStyleProperty) {
      el.current.setStyleProperty('transform', `translateX(${value}px)`)
    }
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function _jumpAndAnimate(targetIndex: number) {
  'main thread'
  if (isDraggingRef.current) return
  if (internalCommitRef.current) {
    internalCommitRef.current = false
    return
  }
  const target = -targetIndex * itemWidthRef.current
  _animateTo(target)
}

function _pruneQueue(ms: number, minLen: number) {
  'main thread'
  const tq = timeQueueRef.current
  const pq = posQueueRef.current
  const now = Date.now()
  while (tq.length > minLen && tq[0] < now - ms) {
    tq.shift()
    pq.shift()
  }
}

function _onTouchStart(e: { detail: { x: number } }) {
  'main thread'
  if (disabledRef.current) return
  // Cancel any in-flight animation by bumping the generation.
  animGenRef.current = animGenRef.current + 1
  isDraggingRef.current = true
  const x = e.detail.x
  touchStartXRef.current = x
  touchStartOffsetRef.current = offsetRef.current
  timeQueueRef.current = [Date.now()]
  posQueueRef.current = [x]
  runOnBackground(_emitSwipeStart as any)()
}

function _onTouchMove(e: { detail: { x: number } }) {
  'main thread'
  if (!isDraggingRef.current) return
  const x = e.detail.x
  const delta = x - touchStartXRef.current
  const width = itemWidthRef.current
  const count = itemCountRef.current
  let next = touchStartOffsetRef.current + delta
  const minOffset = -(count - 1) * width
  if (next > 0) next = 0
  if (next < minOffset) next = minOffset
  offsetRef.current = next
  _setTransform(next)
  posQueueRef.current.push(x)
  timeQueueRef.current.push(Date.now())
  _pruneQueue(50, 2)
}

function _onTouchEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  // Inline velocity (px/s).
  _pruneQueue(500, 0)
  const tq = timeQueueRef.current
  const pq = posQueueRef.current
  let velocity = 0
  if (tq.length >= 2) {
    const dt = (tq[tq.length - 1] - tq[0]) / 1000
    if (dt > 0) velocity = (pq[pq.length - 1] - pq[0]) / dt
  }

  const startOffset = touchStartOffsetRef.current
  const endOffset = offsetRef.current
  const width = itemWidthRef.current
  const count = itemCountRef.current
  const threshold = thresholdRef.current
  const vThreshold = velocityThresholdRef.current

  // Inline customRound + paging.
  let target: number
  const ratio = -endOffset / width
  const decimal = ratio - Math.floor(ratio)
  if (decimal >= threshold) target = Math.ceil(ratio)
  else target = Math.floor(ratio)

  // Velocity flick overrides — advance/retreat one step from start index.
  if (velocity < 0 ? -velocity >= vThreshold : velocity >= vThreshold) {
    const startIdx = Math.round(-startOffset / width)
    target = startIdx + (velocity < 0 ? 1 : -1)
  }

  if (target < 0) target = 0
  if (target > count - 1) target = count - 1

  const targetOffset = -target * width
  internalCommitRef.current = true
  _animateTo(targetOffset)
  runOnBackground(_settle as any)(target)
}

// --- BG callbacks ---------------------------------------------------------

function _emitSwipeStart() {
  emits('swipeStart')
}

function _settle(target: number) {
  if (target !== currentIndex.value) currentIndex.value = target
  emits('swipeEnd', target)
}

// --- Public API -----------------------------------------------------------

function setIndex(index: number) {
  let next = index
  if (next < 0) next = 0
  if (next > props.itemCount - 1) next = props.itemCount - 1
  currentIndex.value = next
}

// --- Lifecycle ------------------------------------------------------------

onMounted(() => {
  runOnMainThread(_setTransform as any)(offsetRef.current)
})

onUnmounted(() => {
  animGenRef.current = animGenRef.current + 1
  posQueueRef.current = []
  timeQueueRef.current = []
})

defineExpose({ setIndex })

provideSwiperRootContext({
  currentIndex,
  itemCount,
  itemWidth,
  setIndex,
})
</script>

<template>
  <view class="vyui-swiper" data-vyui-swiper-root :style="{ overflow: 'hidden' }">
    <view
      class="vyui-swiper__track"
      :main-thread-ref="containerRef"
      :main-thread-bindtouchstart="_onTouchStart"
      :main-thread-bindtouchmove="_onTouchMove"
      :main-thread-bindtouchend="_onTouchEnd"
      :main-thread-bindtouchcancel="_onTouchEnd"
      :style="{ display: 'flex', flexDirection: 'row' }"
    >
      <slot />
    </view>
  </view>
</template>
