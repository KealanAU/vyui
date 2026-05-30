// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Shared horizontal drag-gesture controller for paged surfaces (Swiper today;
// Sheet/drawer next — see #37). Owns the MT refs, the prop→MT-ref sync, the
// velocity queue, the rAF snap animation, and the MT↔BG hops, so a component
// only supplies config + settle callbacks.
//
// Worklet constraints, learned the hard way in `SwiperRoot.vue`:
//   - `'main thread'` bodies are INLINE and SELF-CONTAINED. They do NOT call
//     worklets in another file (cross-file worklet calls don't resolve), so
//     the math here MIRRORS `./physics.ts` (the unit-tested spec) rather than
//     importing it. Keep the two in sync.
//   - Worklets are never stored in a ref and invoked (`ref.current()` kills the
//     `_workletMap` lookup). The animation uses an integer generation counter
//     to cancel instead.
//   - Inner helpers nested inside a worklet carry NO directive — they run in
//     the outer worklet's closure. Only the top-level handlers are worklets.
//
// DEVICE-VERIFY (can't run under vitest — see #6): whether a worklet defined
// in this `.ts` and bound to `:main-thread-bind*` in a consuming `.vue`
// template registers correctly. This mirrors Sheet's proven `.vue`→`.vue`
// cross-file worklet binding (`SheetContentImpl` → `SheetHandle`), with the
// source module being a `.ts` instead of an SFC.

import type { Ref } from 'vue'
import { onMounted, onUnmounted, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

export interface DragGestureConfig {
  /** Controlled index (v-model). The controller animates to it on change and
   *  writes the settled index back to it. */
  currentIndex: Ref<number>
  /** Width of one item (incl. spacing), px. */
  itemWidth: () => number
  /** Total item count. */
  itemCount: () => number
  /** Snap animation duration, ms. */
  duration: () => number
  /** Fraction of `itemWidth` dragged past which the snap rounds up. */
  threshold: () => number
  /** px/s flick above which a release advances by one item. */
  velocityThreshold: () => number
  /** When true, touch input is ignored. */
  disabled: () => boolean
  /** Fired (on BG) when a drag begins. */
  onSwipeStart: () => void
  /** Fired (on BG) with the settled index when a drag ends. */
  onSwipeEnd: (index: number) => void
}

export interface DragGesture {
  /** Bind to the draggable track's `:main-thread-ref`. */
  containerRef: ReturnType<typeof useMainThreadRef<any>>
  onTouchStart: (e: { detail: { x: number } }) => void
  onTouchMove: (e: { detail: { x: number } }) => void
  onTouchEnd: () => void
  /** Clamp + commit an index programmatically (BG side). */
  setIndex: (index: number) => void
}

export function useDragGesture(config: DragGestureConfig): DragGesture {
  const { currentIndex } = config

  // --- MT refs -------------------------------------------------------------
  const containerRef = useMainThreadRef<any>(null)

  const offsetRef = useMainThreadRef<number>(-(currentIndex.value ?? 0) * config.itemWidth())
  const touchStartXRef = useMainThreadRef<number>(0)
  const touchStartOffsetRef = useMainThreadRef<number>(0)
  const isDraggingRef = useMainThreadRef<boolean>(false)
  const internalCommitRef = useMainThreadRef<boolean>(false)

  const itemWidthRef = useMainThreadRef<number>(config.itemWidth())
  const itemCountRef = useMainThreadRef<number>(config.itemCount())
  const durationRef = useMainThreadRef<number>(config.duration())
  const thresholdRef = useMainThreadRef<number>(config.threshold())
  const velocityThresholdRef = useMainThreadRef<number>(config.velocityThreshold())
  const disabledRef = useMainThreadRef<boolean>(config.disabled())

  const posQueueRef = useMainThreadRef<number[]>([])
  const timeQueueRef = useMainThreadRef<number[]>([])

  // Animation generation counter — a worklet checks its starting generation
  // against the current one each frame and bails if a newer animation began.
  const animGenRef = useMainThreadRef<number>(0)

  // --- BG → MT sync --------------------------------------------------------
  watch(config.itemWidth, (v) => { itemWidthRef.current = v })
  watch(config.itemCount, (v) => { itemCountRef.current = v })
  watch(config.duration, (v) => { durationRef.current = v })
  watch(config.threshold, (v) => { thresholdRef.current = v })
  watch(config.velocityThreshold, (v) => { velocityThresholdRef.current = v })
  watch(config.disabled, (v) => { disabledRef.current = v })

  watch(currentIndex, (next, prev) => {
    if (next === prev) return
    runOnMainThread(_jumpAndAnimate as any)(next)
  })

  // --- Worklets (all inline; no cross-file calls, no stored worklets) ------

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
    // Plain nested function — runs inside the outer worklet's closure, no own
    // `_wkltId`. `eased` mirrors physics.ts `easeOutCubic`.
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

    // Inline velocity (px/s) — mirrors physics.ts `calcVelocity`.
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

    // Inline customRound + paging — mirrors physics.ts `customRound`/`calcPaging`.
    let target: number
    const ratio = -endOffset / width
    const decimal = ratio - Math.floor(ratio)
    if (decimal >= threshold) target = Math.ceil(ratio)
    else target = Math.floor(ratio)

    // Velocity flick overrides — advance/retreat one step from start index.
    // (Carousel paging policy: flick steps from where the user grabbed, not
    // from the nearest candidate — see physics.ts `decideSnapTarget`.)
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

  // --- BG callbacks --------------------------------------------------------

  function _emitSwipeStart() {
    config.onSwipeStart()
  }

  function _settle(target: number) {
    if (target !== currentIndex.value) currentIndex.value = target
    config.onSwipeEnd(target)
  }

  // --- Public API ----------------------------------------------------------

  function setIndex(index: number) {
    let next = index
    if (next < 0) next = 0
    if (next > config.itemCount() - 1) next = config.itemCount() - 1
    currentIndex.value = next
  }

  // --- Lifecycle -----------------------------------------------------------

  onMounted(() => {
    runOnMainThread(_setTransform as any)(offsetRef.current)
  })

  onUnmounted(() => {
    animGenRef.current = animGenRef.current + 1
    posQueueRef.current = []
    timeQueueRef.current = []
  })

  return {
    containerRef,
    onTouchStart: _onTouchStart,
    onTouchMove: _onTouchMove,
    onTouchEnd: _onTouchEnd,
    setIndex,
  }
}
