// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Shared horizontal drag-gesture controller for paged surfaces (Swiper today;
// Sheet/drawer next — see #37). Owns the MT refs, the prop→MT-ref sync, the
// velocity queue, the rAF snap animation, axis lock, autoplay, and the MT↔BG
// hops, so a component only supplies config + settle callbacks.
//
// BG → MT sync: in vue-lynx@0.4.0 a background-thread write to
// `MainThreadRef.current` is silently dropped (the setter is a no-op; only the
// constructor's `INIT_MT_REF` op transfers a value BG→MT). So every prop
// change is pushed by dispatching a setter worklet via `runOnMainThread`
// (`_syncConfig` below), and writes to `.current` happen only INSIDE worklets,
// where they are MT-local and stick.
//
// Worklet constraints, learned the hard way in `SwiperRoot.vue`:
//   - `'main thread'` bodies are INLINE and SELF-CONTAINED. They do NOT call
//     worklets in another file (cross-file worklet calls don't resolve), so
//     the math here MIRRORS `./physics.ts` (the unit-tested spec) rather than
//     importing it. Keep the two in sync.
//   - Worklets are never stored in a ref and invoked (`ref.current()` kills the
//     `_workletMap` lookup). The animation uses an integer generation counter
//     to cancel instead.
//   - MT worklet fns become `const`; you cannot forward-reference one worklet
//     from another. Define helper worklets ABOVE their callers.
//   - Inner helpers nested inside a worklet carry NO directive — they run in
//     the outer worklet's closure. Only the top-level handlers are worklets.
//
// DEVICE-VERIFY (can't run under vitest — see #6): whether a worklet defined
// in this `.ts` and bound to `:main-thread-bind*` in a consuming `.vue`
// template registers correctly. This mirrors Sheet's proven `.vue`→`.vue`
// cross-file worklet binding (`SheetContentImpl` → `SheetHandle`), with the
// source module being a `.ts` instead of an SFC.

import type { Ref } from 'vue'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
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
  /** When true, navigation wraps circularly (index 0 ↔ last). */
  loop?: () => boolean
  /**
   * When true, a gesture that starts off-axis (more vertical than horizontal)
   * is released back to the host scroll surface instead of being consumed.
   * Mirrors lynx-ui `experimentalHorizontalSwipeOnly`.
   */
  axisLock?: () => boolean
  /** When true, the swiper auto-advances on an interval. */
  autoplay?: () => boolean
  /** Autoplay step interval, ms (added to `duration`). */
  interval?: () => number
  /** Fired (on BG) when a drag begins. */
  onSwipeStart: () => void
  /** Fired (on BG) with the settled index when a drag ends. */
  onSwipeEnd: (index: number) => void
}

export interface DragGesture {
  /** Bind to the draggable track's `:main-thread-ref`. */
  containerRef: ReturnType<typeof useMainThreadRef<any>>
  onTouchStart: (e: { detail: { x: number, y: number } }) => void
  onTouchMove: (e: { detail: { x: number, y: number } }) => void
  onTouchEnd: () => void
  /** Clamp/wrap + commit an index programmatically (BG side). */
  setIndex: (index: number) => void
}

/** Slop (px) before axis lock engages — mirrors physics.ts GESTURE_THRESHOLD. */
const GESTURE_THRESHOLD = 8

export function useDragGesture(config: DragGestureConfig): DragGesture {
  const { currentIndex } = config

  const loopGetter = config.loop ?? (() => false)
  const axisLockGetter = config.axisLock ?? (() => false)
  const autoplayGetter = config.autoplay ?? (() => false)
  const intervalGetter = config.interval ?? (() => 3000)

  // --- MT refs -------------------------------------------------------------
  const containerRef = useMainThreadRef<any>(null)

  const offsetRef = useMainThreadRef<number>(-(currentIndex.value ?? 0) * config.itemWidth())
  const touchStartXRef = useMainThreadRef<number>(0)
  const touchStartYRef = useMainThreadRef<number>(0)
  const touchStartOffsetRef = useMainThreadRef<number>(0)
  const isDraggingRef = useMainThreadRef<boolean>(false)
  // Offset a drag just settled to, pending consumption by `_jumpAndAnimate`.
  // NaN is the "nothing pending" sentinel (no valid offset is NaN). An offset
  // rather than a boolean flag because `_settle` only writes `currentIndex`
  // when the index actually changed — a same-index snap-back never fires the
  // watch, and a stale boolean would swallow the NEXT programmatic change.
  // Comparing offsets makes a stale value harmless: a later change to a
  // different index produces a different target and still animates.
  const expectedOffsetRef = useMainThreadRef<number>(Number.NaN)

  // Axis-lock state. Once a gesture crosses GESTURE_THRESHOLD we decide whether
  // it is "horizontal enough" to consume; if not, axisLockedRef stays true and
  // subsequent moves are ignored so the host scroll surface keeps the gesture.
  const gestureLockedRef = useMainThreadRef<boolean>(false)
  const axisLockedRef = useMainThreadRef<boolean>(false)

  const itemWidthRef = useMainThreadRef<number>(config.itemWidth())
  const itemCountRef = useMainThreadRef<number>(config.itemCount())
  const durationRef = useMainThreadRef<number>(config.duration())
  const thresholdRef = useMainThreadRef<number>(config.threshold())
  const velocityThresholdRef = useMainThreadRef<number>(config.velocityThreshold())
  const disabledRef = useMainThreadRef<boolean>(config.disabled())
  const loopRef = useMainThreadRef<boolean>(loopGetter())
  const axisLockEnabledRef = useMainThreadRef<boolean>(axisLockGetter())

  // Autoplay MT state.
  const autoplayRef = useMainThreadRef<boolean>(autoplayGetter())
  const intervalRef = useMainThreadRef<number>(intervalGetter())
  const autoplayTimerRef = useMainThreadRef<number>(0)
  const autoplayStoppedRef = useMainThreadRef<boolean>(false)

  const posQueueRef = useMainThreadRef<number[]>([])
  const timeQueueRef = useMainThreadRef<number[]>([])

  // Animation generation counter — a worklet checks its starting generation
  // against the current one each frame and bails if a newer animation began.
  const animGenRef = useMainThreadRef<number>(0)

  // --- BG → MT sync --------------------------------------------------------
  // BG-side writes to `MainThreadRef.current` are silently dropped in
  // vue-lynx@0.4.0, so values must hop via `runOnMainThread` (see header).
  watch(
    [
      config.itemWidth,
      config.itemCount,
      config.duration,
      config.threshold,
      config.velocityThreshold,
      config.disabled,
      loopGetter,
      axisLockGetter,
    ],
    ([itemWidth, itemCount, duration, threshold, velocityThreshold, disabled, loop, axisLock]) => {
      runOnMainThread(_syncConfig as any)(
        itemWidth, itemCount, duration, threshold, velocityThreshold, disabled, loop, axisLock,
      )
    },
  )

  // Autoplay enable/interval changes — (re)start or pause on the MT.
  watch([autoplayGetter, intervalGetter], ([autoplay, interval]) => {
    runOnMainThread(_syncAutoplay as any)(autoplay, interval)
  })

  watch(currentIndex, (next, prev) => {
    if (next === prev) return
    runOnMainThread(_jumpAndAnimate as any)(next)
  })

  // --- Worklets (all inline; no cross-file calls, no stored worklets) ------
  // Defined in dependency order: a worklet may only reference worklets above
  // it (MT worklet fns become `const`; forward refs throw at setup).

  function _syncConfig(
    itemWidth: number,
    itemCount: number,
    duration: number,
    threshold: number,
    velocityThreshold: number,
    disabled: boolean,
    loop: boolean,
    axisLock: boolean,
  ) {
    'main thread'
    itemWidthRef.current = itemWidth
    itemCountRef.current = itemCount
    durationRef.current = duration
    thresholdRef.current = threshold
    velocityThresholdRef.current = velocityThreshold
    disabledRef.current = disabled
    loopRef.current = loop
    axisLockEnabledRef.current = axisLock
  }

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

  // Advance one step on the MT (used by autoplay). Wraps in loop mode, stops at
  // the last item otherwise.
  function _advance() {
    'main thread'
    if (isDraggingRef.current) return
    const width = itemWidthRef.current
    const count = itemCountRef.current
    if (count <= 1) return
    const cur = Math.round(-offsetRef.current / width)
    let next = cur + 1
    if (next > count - 1) {
      if (loopRef.current) next = 0
      else return
    }
    const targetOffset = -next * width
    expectedOffsetRef.current = targetOffset
    _animateTo(targetOffset)
    runOnBackground(_settle as any)(next)
  }

  // Autoplay loop. setTimeout chains itself; cancelled by clearing the timer
  // and flipping `autoplayStoppedRef`. interval + duration so a step completes
  // its snap before the next begins.
  function _autoplayTick() {
    'main thread'
    if (autoplayStoppedRef.current || !autoplayRef.current) return
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    autoplayTimerRef.current = setTimeout(() => {
      if (autoplayStoppedRef.current || !autoplayRef.current) return
      _advance()
      _autoplayTick()
    }, intervalRef.current + durationRef.current) as unknown as number
  }

  function _autoplayStart() {
    'main thread'
    if (!autoplayRef.current) return
    autoplayStoppedRef.current = false
    _autoplayTick()
  }

  function _autoplayStop() {
    'main thread'
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    autoplayTimerRef.current = 0
    autoplayStoppedRef.current = true
  }

  function _syncAutoplay(autoplay: boolean, interval: number) {
    'main thread'
    autoplayRef.current = autoplay
    intervalRef.current = interval
    if (autoplay) _autoplayStart()
    else _autoplayStop()
  }

  function _jumpAndAnimate(targetIndex: number) {
    'main thread'
    if (isDraggingRef.current) return
    const target = -targetIndex * itemWidthRef.current
    const expected = expectedOffsetRef.current
    expectedOffsetRef.current = Number.NaN
    // Skip only when this change is the echo of a settle we already animated.
    // The NaN sentinel falls through on its own: `NaN === target` is false.
    if (expected === target) return
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

  function _onTouchStart(e: { detail: { x: number, y: number } }) {
    'main thread'
    if (disabledRef.current) return
    // Pause autoplay for the duration of the drag.
    _autoplayStop()
    // Cancel any in-flight animation by bumping the generation.
    animGenRef.current = animGenRef.current + 1
    isDraggingRef.current = true
    gestureLockedRef.current = false
    axisLockedRef.current = false
    const x = e.detail.x
    const y = e.detail.y
    touchStartXRef.current = x
    touchStartYRef.current = y
    touchStartOffsetRef.current = offsetRef.current
    timeQueueRef.current = [Date.now()]
    posQueueRef.current = [x]
    runOnBackground(_emitSwipeStart as any)()
  }

  function _onTouchMove(e: { detail: { x: number, y: number } }) {
    'main thread'
    if (!isDraggingRef.current) return
    const x = e.detail.x
    const y = e.detail.y

    // Axis lock: once the gesture crosses the slop radius, classify it. If it
    // is more vertical than horizontal, lock to the cross axis and stop
    // consuming moves (host scroll keeps it). Mirrors physics.ts resolveAxisLock
    // with the ±45° HORIZONTAL_CONSUME_RANGES.
    if (axisLockEnabledRef.current && !gestureLockedRef.current) {
      const dX = x - touchStartXRef.current
      const dY = y - touchStartYRef.current
      const displacement = Math.sqrt(dX * dX + dY * dY)
      if (displacement > GESTURE_THRESHOLD) {
        const angle = (Math.atan2(dY, dX) * 180) / Math.PI
        // Horizontal-enough if angle within ±45° of either horizontal direction.
        const a = angle < 0 ? -angle : angle
        const horizontal = a <= 45 || a >= 135
        gestureLockedRef.current = true
        axisLockedRef.current = !horizontal
      }
    }
    if (axisLockedRef.current) return

    const delta = x - touchStartXRef.current
    const width = itemWidthRef.current
    const count = itemCountRef.current
    let next = touchStartOffsetRef.current + delta
    // Offset clamping. Loop mode never clamps; otherwise clamp to [min, 0].
    if (!loopRef.current) {
      const minOffset = -(count - 1) * width
      if (next > 0) next = 0
      if (next < minOffset) next = minOffset
    }
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

    // If the gesture was locked to the cross axis, don't snap — let the host
    // scroll surface have settled it. Restore autoplay and bail.
    if (axisLockedRef.current) {
      gestureLockedRef.current = false
      axisLockedRef.current = false
      if (autoplayRef.current) _autoplayStart()
      return
    }
    gestureLockedRef.current = false
    axisLockedRef.current = false

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
    const loop = loopRef.current

    // Inline customRound + paging — mirrors physics.ts `customRound`/`calcPaging`.
    let target: number
    const ratio = -endOffset / width
    const decimal = ratio - Math.floor(ratio)
    if (decimal >= threshold) target = Math.ceil(ratio)
    else target = Math.floor(ratio)

    // Velocity flick overrides — advance/retreat one step from start index.
    // (Carousel paging policy: flick steps from where the user grabbed.)
    if (velocity < 0 ? -velocity >= vThreshold : velocity >= vThreshold) {
      const startIdx = Math.round(-startOffset / width)
      target = startIdx + (velocity < 0 ? 1 : -1)
    }

    // Wrap (loop) or clamp (default) the index.
    if (loop) {
      target = ((target % count) + count) % count
    }
    else {
      if (target < 0) target = 0
      if (target > count - 1) target = count - 1
    }

    const targetOffset = -target * width
    expectedOffsetRef.current = targetOffset
    _animateTo(targetOffset)
    runOnBackground(_settle as any)(target)

    // Resume autoplay after the drag settled.
    if (autoplayRef.current) _autoplayStart()
  }

  function _teardown() {
    'main thread'
    // Bump the generation so an in-flight rAF `step` bails on its next frame,
    // drop the velocity queues, and kill the autoplay timer. Must run ON MT —
    // the equivalent BG-side `.current` writes are silently dropped (header).
    animGenRef.current = animGenRef.current + 1
    isDraggingRef.current = false
    posQueueRef.current = []
    timeQueueRef.current = []
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    autoplayTimerRef.current = 0
    autoplayStoppedRef.current = true
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
    const count = config.itemCount()
    if (count <= 0) return
    let next = index
    if (loopGetter()) {
      next = ((next % count) + count) % count
    }
    else {
      if (next < 0) next = 0
      if (next > count - 1) next = count - 1
    }
    currentIndex.value = next
  }

  // --- Lifecycle -----------------------------------------------------------

  onMounted(() => {
    const initialOffset = -(currentIndex.value ?? 0) * config.itemWidth()
    // Index 0 → translateX(0) is already the laid-out position, so skip the
    // dispatch: `runOnMainThread` during mount travels over
    // `coreContext.dispatchEvent`, a different channel from the batched op
    // queue carrying `INIT_MT_REF`, and can reach MT before the refs are
    // registered (vue-lynx@0.4.0 — see SheetContentImpl.vue). Touch handlers
    // are immune: `SET_WORKLET_EVENT` flushes in the same batch as
    // `INIT_MT_REF`.
    if (initialOffset !== 0) {
      // Nonzero initial index: defer past the post-flush op batch. nextTick
      // narrows but does NOT close the cross-channel race.
      void nextTick().then(() => {
        runOnMainThread(_setTransform as any)(initialOffset)
      })
    }
    // Kick off autoplay if enabled at mount. Deferred for the same reason.
    if (autoplayGetter()) {
      void nextTick().then(() => {
        runOnMainThread(_autoplayStart as any)()
      })
    }
  })

  onUnmounted(() => {
    // Fire-and-forget MT hop — direct `.current` writes here would be BG-side
    // no-ops and the in-flight rAF snap / autoplay timer would keep running.
    runOnMainThread(_teardown as any)()
  })

  return {
    containerRef,
    onTouchStart: _onTouchStart,
    onTouchMove: _onTouchMove,
    onTouchEnd: _onTouchEnd,
    setIndex,
  }
}
