// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// BG → MT sync: vue-lynx@0.4.0 silently drops background-thread writes to
// `MainThreadRef.current` (only the constructor's `INIT_MT_REF` op transfers a
// value BG→MT), so every prop change is pushed by dispatching a setter worklet
// via `runOnMainThread` (`_syncConfig` below).
//
// Worklet constraints:
//   - `'main thread'` bodies are INLINE and SELF-CONTAINED; cross-file worklet
//     calls don't resolve, so the math here MIRRORS `./physics.ts` (the
//     unit-tested spec) rather than importing it. Keep the two in sync.
//   - Worklets are never stored in a ref and invoked (`ref.current()` kills the
//     `_workletMap` lookup); the animation uses a generation counter instead.
//   - MT worklet fns become `const`; define helper worklets ABOVE their callers.
//   - Inner helpers nested inside a worklet carry NO directive.

import type { Ref } from 'vue'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

export interface DragGestureConfig {
  /** Controlled index (v-model). The controller animates to it on change and
   *  writes the settled index back to it. */
  currentIndex: Ref<number>
  /** Width of one item (NOT incl. spacing), px. */
  itemWidth: () => number
  /** Total item count. */
  itemCount: () => number
  /** Gap between adjacent items, px. Snap unit is `itemWidth + spaceBetween`. */
  spaceBetween?: () => number
  /**
   * Active-item alignment within the viewport (`mode: 'normal'`). Mirrors
   * lynx-ui `modeConfig.align`. Default `'start'`.
   */
  align?: () => 'start' | 'center' | 'end'
  /** Viewport (container) width, px — required for `align` center/end. */
  containerWidth?: () => number
  /**
   * Explicit `[startLimit, endLimit]` non-loop offset clamp, px past each edge.
   * Mirrors lynx-ui `offsetLimit`. Loop mode ignores this.
   */
  offsetLimit?: () => [number, number] | undefined
  /** Right-to-left layout: a forward (next) swipe moves visually rightward. */
  rtl?: () => boolean
  /** Snap animation duration, ms. */
  duration: () => number
  /** Fraction of `fullSize` dragged past which the snap rounds up. */
  threshold: () => number
  /** px/s flick above which a release advances by one item. */
  velocityThreshold: () => number
  /** When true, touch input is ignored. */
  disabled: () => boolean
  /** When true, navigation wraps circularly (index 0 ↔ last). */
  loop?: () => boolean
  /**
   * When true, a gesture that starts off-axis is released back to the host
   * scroll surface. Mirrors lynx-ui `experimentalHorizontalSwipeOnly`.
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
  /** Desktop-web mouse twins — same gesture core, top-level coords. */
  onMouseDown: (e: { clientX: number, clientY: number, buttons?: number }) => void
  onMouseMove: (e: { clientX: number, clientY: number, buttons?: number }) => void
  onMouseUp: () => void
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
  const spaceBetweenGetter = config.spaceBetween ?? (() => 0)
  const alignGetter = config.align ?? (() => 'start' as const)
  const containerWidthGetter = config.containerWidth ?? (() => 0)
  const offsetLimitGetter = config.offsetLimit ?? (() => undefined)
  const rtlGetter = config.rtl ?? (() => false)

  // `fullSize` is the source of truth for every offset/index conversion below.
  const fullSizeOf = () => config.itemWidth() + spaceBetweenGetter()

  // Non-loop offset clamp `[startLimit, endLimit]` from an explicit
  // `offsetLimit` prop, else derived from `align` + `containerWidth`. Mirrors
  // lynx-ui `useOffsetLimit`. Returned in px past each edge.
  function resolveLimits(): { startLimit: number, endLimit: number } {
    const explicit = offsetLimitGetter()
    if (explicit) return { startLimit: explicit[0], endLimit: explicit[1] }
    const cw = containerWidthGetter()
    const iw = config.itemWidth()
    const align = alignGetter()
    if (cw > 0 && align === 'end') return { startLimit: cw - iw, endLimit: 0 }
    // 'start' / 'center' default: clamp exactly to the item range.
    return { startLimit: 0, endLimit: 0 }
  }

  // Align nudge applied at transform time only; the virtual offset stays
  // index-based. Mirrors lynx-ui `onOffsetUpdate`.
  function alignOffsetOf(): number {
    const align = alignGetter()
    const cw = containerWidthGetter()
    const iw = config.itemWidth()
    if (cw <= 0) return 0
    if (align === 'center') return (cw - iw) / 2
    if (align === 'end') return cw - iw
    return 0
  }

  const containerRef = useMainThreadRef<any>(null)

  const offsetRef = useMainThreadRef<number>(-(currentIndex.value ?? 0) * fullSizeOf())
  const touchStartXRef = useMainThreadRef<number>(0)
  const touchStartYRef = useMainThreadRef<number>(0)
  const touchStartOffsetRef = useMainThreadRef<number>(0)
  const isDraggingRef = useMainThreadRef<boolean>(false)
  // Offset a drag just settled to, pending consumption by `_jumpAndAnimate`.
  // NaN is the "nothing pending" sentinel. An offset rather than a boolean so a
  // stale value stays harmless: `_settle` only writes `currentIndex` when the
  // index changed, and a later change to a different index still animates.
  const expectedOffsetRef = useMainThreadRef<number>(Number.NaN)

  // Axis lock: a gesture that isn't "horizontal enough" leaves `axisLockedRef`
  // true and subsequent moves are ignored so host scroll keeps the gesture.
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

  const fullSizeRef = useMainThreadRef<number>(fullSizeOf())
  const alignOffsetRef = useMainThreadRef<number>(alignOffsetOf())
  const startLimitRef = useMainThreadRef<number>(resolveLimits().startLimit)
  const endLimitRef = useMainThreadRef<number>(resolveLimits().endLimit)
  const rtlRef = useMainThreadRef<boolean>(rtlGetter())

  const autoplayRef = useMainThreadRef<boolean>(autoplayGetter())
  const intervalRef = useMainThreadRef<number>(intervalGetter())
  const autoplayTimerRef = useMainThreadRef<number>(0)
  const autoplayStoppedRef = useMainThreadRef<boolean>(false)

  const posQueueRef = useMainThreadRef<number[]>([])
  const timeQueueRef = useMainThreadRef<number[]>([])

  // Timestamp of the last real touch: touch browsers replay a tap as a
  // compatibility mousedown/mouseup pair, which mouse handlers ignore.
  const lastTouchTsRef = useMainThreadRef<number>(0)

  // Animation generation counter — a worklet checks its starting generation
  // against the current one each frame and bails if a newer animation began.
  const animGenRef = useMainThreadRef<number>(0)

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

  // Layout/parity sync — computed on BG, pushed to MT-local refs.
  watch(
    [
      config.itemWidth,
      spaceBetweenGetter,
      alignGetter,
      containerWidthGetter,
      () => offsetLimitGetter()?.[0],
      () => offsetLimitGetter()?.[1],
      rtlGetter,
    ],
    () => {
      const limits = resolveLimits()
      runOnMainThread(_syncLayout as any)(
        fullSizeOf(), alignOffsetOf(), limits.startLimit, limits.endLimit, rtlGetter(),
      )
    },
  )

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

  function _syncLayout(
    fullSize: number,
    alignOffset: number,
    startLimit: number,
    endLimit: number,
    rtl: boolean,
  ) {
    'main thread'
    fullSizeRef.current = fullSize
    alignOffsetRef.current = alignOffset
    startLimitRef.current = startLimit
    endLimitRef.current = endLimit
    rtlRef.current = rtl
  }

  // Apply the virtual `offset` to the track transform. In RTL the sign flips so
  // a "next" step reads as forward. Mirrors lynx-ui `onOffsetUpdate`/`setOffset`.
  function _setTransform(offset: number) {
    'main thread'
    const el = containerRef as unknown as {
      current?: { setStyleProperty?(k: string, v: string): void }
    }
    let effective = offset + alignOffsetRef.current
    if (rtlRef.current) effective = -effective
    if (el.current?.setStyleProperty) {
      el.current.setStyleProperty('transform', `translateX(${effective}px)`)
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
      let effective = value + alignOffsetRef.current
      if (rtlRef.current) effective = -effective
      if (el.current?.setStyleProperty) {
        el.current.setStyleProperty('transform', `translateX(${effective}px)`)
      }
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // Seamless seam crossing: animate to `rawTo` (in the clone region), then on
  // the final frame rebase the resting offset to `realTo` (the same slide in the
  // real period). Clones are exact copies, so the rebase is invisible.
  function _animateToSeam(rawTo: number, realTo: number) {
    'main thread'
    animGenRef.current = animGenRef.current + 1
    const gen = animGenRef.current
    const from = offsetRef.current
    const ms = durationRef.current
    if (ms <= 0 || from === rawTo) {
      offsetRef.current = realTo
      _setTransform(realTo)
      return
    }
    let startTs = 0
    function step(ts: number) {
      if (gen !== animGenRef.current) return
      if (!startTs) startTs = Number(ts)
      let elapsed = Number(ts) - startTs
      if (elapsed < 0) elapsed = 0
      let progress = elapsed / ms
      if (progress > 1) progress = 1
      const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress)
      const value = from + (rawTo - from) * eased
      const el = containerRef as unknown as {
        current?: { setStyleProperty?(k: string, v: string): void }
      }
      if (progress < 1) {
        offsetRef.current = value
        let effective = value + alignOffsetRef.current
        if (rtlRef.current) effective = -effective
        if (el.current?.setStyleProperty) {
          el.current.setStyleProperty('transform', `translateX(${effective}px)`)
        }
        requestAnimationFrame(step)
      }
      else {
        // Final frame: rest in the real period (invisible rebase across clones).
        offsetRef.current = realTo
        let effective = realTo + alignOffsetRef.current
        if (rtlRef.current) effective = -effective
        if (el.current?.setStyleProperty) {
          el.current.setStyleProperty('transform', `translateX(${effective}px)`)
        }
      }
    }
    requestAnimationFrame(step)
  }

  // Seam-aware animate: from the CURRENT offset to a raw (possibly
  // out-of-range) target, then commit the wrapped index. The `currentIndex`
  // watch echo is suppressed by the expectedOffset guard and the next gesture
  // reads `offsetRef` directly, so the seam is invisible. Mirrors lynx-ui
  // `calcLoop` (physics.ts `calcLoop`).
  function _animateToIndex(rawIndex: number) {
    'main thread'
    const full = fullSizeRef.current
    const count = itemCountRef.current
    if (count <= 0) return
    let wrapped = rawIndex
    if (loopRef.current) {
      wrapped = ((rawIndex % count) + count) % count
    }
    else {
      if (wrapped < 0) wrapped = 0
      if (wrapped > count - 1) wrapped = count - 1
    }
    // Seamless target: animate to the RAW (unwrapped) offset, then snap back
    // into the real period once settled (via expectedOffset rebasing below).
    const rawOffset = -rawIndex * full
    const wrappedOffset = -wrapped * full
    expectedOffsetRef.current = wrappedOffset
    if (loopRef.current && rawOffset !== wrappedOffset) {
      _animateToSeam(rawOffset, wrappedOffset)
    }
    else {
      _animateTo(wrappedOffset)
    }
    runOnBackground(_settle as any)(wrapped)
  }

  // Advance one step on the MT (autoplay). Wraps in loop mode.
  function _advance() {
    'main thread'
    if (isDraggingRef.current) return
    const full = fullSizeRef.current
    const count = itemCountRef.current
    if (count <= 1) return
    const cur = Math.round(-offsetRef.current / full)
    const next = cur + 1
    if (next > count - 1 && !loopRef.current) return
    _animateToIndex(next)
  }

  // Autoplay loop. setTimeout chains itself; cancelled by clearing the timer
  // and flipping `autoplayStoppedRef`. interval + duration so a step completes.
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
    const target = -targetIndex * fullSizeRef.current
    const expected = expectedOffsetRef.current
    expectedOffsetRef.current = Number.NaN
    // Skip only when this change is the echo of a settle we already animated.
    // The NaN sentinel falls through on its own: `NaN === target` is false.
    if (expected === target) return
    // Programmatic jump: shortest seamless path in loop mode, so setIndex(0)
    // from the last item slides forward over the seam.
    if (loopRef.current) {
      const full = fullSizeRef.current
      const count = itemCountRef.current
      if (count > 0) {
        const cur = Math.round(-offsetRef.current / full)
        const curMod = ((cur % count) + count) % count
        let forward = targetIndex - curMod
        forward = ((forward % count) + count) % count
        const backward = forward - count
        const step = Math.abs(forward) <= Math.abs(backward) ? forward : backward
        _animateToIndex(cur + step)
        return
      }
    }
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

  // Coordinate-based gesture cores. A gesture is all-touch or all-mouse, so the
  // coordinate spaces never mix — only deltas from the recorded start matter.

  function _dragStart(x: number, y: number) {
    'main thread'
    if (disabledRef.current) return
    _autoplayStop()
    animGenRef.current = animGenRef.current + 1
    isDraggingRef.current = true
    gestureLockedRef.current = false
    axisLockedRef.current = false
    touchStartXRef.current = x
    touchStartYRef.current = y
    touchStartOffsetRef.current = offsetRef.current
    timeQueueRef.current = [Date.now()]
    posQueueRef.current = [x]
    runOnBackground(_emitSwipeStart as any)()
  }

  function _dragMove(x: number, y: number) {
    'main thread'
    if (!isDraggingRef.current) return

    // Axis lock: classify once the gesture crosses the slop radius. Mirrors
    // physics.ts resolveAxisLock with the ±45° HORIZONTAL_CONSUME_RANGES.
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

    // RTL: a rightward finger move (positive dX) should read as moving toward
    // LOWER indices, i.e. a positive offset — so flip the delta sign.
    const rawDelta = x - touchStartXRef.current
    const delta = rtlRef.current ? -rawDelta : rawDelta
    const full = fullSizeRef.current
    const count = itemCountRef.current
    let next = touchStartOffsetRef.current + delta
    // Loop mode never clamps (drag enters the clone region freely); otherwise
    // clamp to the align/offsetLimit-aware limits.
    if (!loopRef.current) {
      const maxOffset = startLimitRef.current
      const minOffset = -(count - 1) * full + endLimitRef.current
      if (next > maxOffset) next = maxOffset
      if (next < minOffset) next = minOffset
    }
    offsetRef.current = next
    _setTransform(next)
    posQueueRef.current.push(x)
    timeQueueRef.current.push(Date.now())
    _pruneQueue(50, 2)
  }

  function _dragEnd() {
    'main thread'
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    // Cross-axis lock: don't snap, the host scroll surface settled it.
    if (axisLockedRef.current) {
      gestureLockedRef.current = false
      axisLockedRef.current = false
      if (autoplayRef.current) _autoplayStart()
      return
    }
    gestureLockedRef.current = false
    axisLockedRef.current = false

    // Inline velocity (px/s) — mirrors physics.ts `calcVelocity`. In RTL the
    // sign is flipped so positive = "forward" (toward higher indices).
    _pruneQueue(500, 0)
    const tq = timeQueueRef.current
    const pq = posQueueRef.current
    let velocity = 0
    if (tq.length >= 2) {
      const dt = (tq[tq.length - 1] - tq[0]) / 1000
      if (dt > 0) velocity = (pq[pq.length - 1] - pq[0]) / dt
    }
    if (rtlRef.current) velocity = -velocity

    const startOffset = touchStartOffsetRef.current
    const endOffset = offsetRef.current
    const full = fullSizeRef.current
    const threshold = thresholdRef.current
    const vThreshold = velocityThresholdRef.current

    // Mirrors physics.ts `customRound`/`calcPaging`, in RAW (unwrapped) index
    // space so loop seam crossings stay continuous.
    let target: number
    const ratio = -endOffset / full
    const decimal = ratio - Math.floor(ratio)
    if (decimal >= threshold) target = Math.ceil(ratio)
    else target = Math.floor(ratio)

    // Velocity flick: advance/retreat one step from where the user grabbed.
    if (velocity < 0 ? -velocity >= vThreshold : velocity >= vThreshold) {
      const startIdx = Math.round(-startOffset / full)
      target = startIdx + (velocity < 0 ? 1 : -1)
    }

    _animateToIndex(target)

    if (autoplayRef.current) _autoplayStart()
  }

  function _onTouchStart(e: { detail: { x: number, y: number } }) {
    'main thread'
    _dragStart(e.detail.x, e.detail.y)
  }

  function _onTouchMove(e: { detail: { x: number, y: number } }) {
    'main thread'
    _dragMove(e.detail.x, e.detail.y)
  }

  function _onTouchEnd() {
    'main thread'
    // Stamp AFTER the end core: stamping first would consume the Date.now()
    // sample the velocity prune expects under useDragGesture.test.ts's clocks.
    _dragEnd()
    lastTouchTsRef.current = Date.now()
  }

  // Desktop web: Lynx web dispatches raw mouse events and never synthesizes
  // touch from them. Coordinates arrive top-level (mouse `detail` is the
  // click-count number). No mouseleave binding — it doesn't bubble, so
  // per-element delivery is unreliable on the Lynx dispatch path.
  function _onMouseDown(e: { clientX: number, clientY: number, buttons?: number }) {
    'main thread'
    // Swallow the compatibility mousedown a touch browser replays after a tap.
    if (Date.now() - lastTouchTsRef.current < 500) return
    // Primary button only: a right/middle press would start a phantom drag
    // that the next hover move then "releases", teleporting the track.
    if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return
    _dragStart(e.clientX, e.clientY)
  }

  function _onMouseMove(e: { clientX: number, clientY: number, buttons?: number }) {
    'main thread'
    // Only an EXPLICIT buttons value with the primary bit clear counts as
    // released (recovers the mouseup lost outside the <lynx-view>); a missing
    // `buttons` is treated as still-pressed.
    if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) {
      _dragEnd()
      return
    }
    _dragMove(e.clientX, e.clientY)
  }

  function _onMouseUp() {
    'main thread'
    _dragEnd()
  }

  function _teardown() {
    'main thread'
    // Bump the generation so an in-flight rAF `step` bails, drop the velocity
    // queues, kill the autoplay timer. Must run ON MT (see header).
    animGenRef.current = animGenRef.current + 1
    isDraggingRef.current = false
    posQueueRef.current = []
    timeQueueRef.current = []
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    autoplayTimerRef.current = 0
    autoplayStoppedRef.current = true
  }


  function _emitSwipeStart() {
    config.onSwipeStart()
  }

  function _settle(target: number) {
    if (target !== currentIndex.value) currentIndex.value = target
    config.onSwipeEnd(target)
  }


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


  onMounted(() => {
    const initialOffset = -(currentIndex.value ?? 0) * fullSizeOf()
    // Dispatch the initial transform only when the resting position isn't the
    // bare `translateX(0)` already laid out: a nonzero start index, an align
    // nudge, or RTL. `runOnMainThread` during mount travels a different channel
    // from the batched op queue carrying `INIT_MT_REF` and can reach MT before
    // the refs are registered (vue-lynx@0.4.0 — see SheetContentImpl.vue).
    if (initialOffset !== 0 || alignOffsetOf() !== 0 || rtlGetter()) {
      // Deferred past the post-flush op batch. nextTick narrows but does NOT
      // close the cross-channel race (see SheetContentImpl.vue).
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
    // Fire-and-forget MT hop — direct `.current` writes here are BG-side no-ops.
    runOnMainThread(_teardown as any)()
  })

  return {
    containerRef,
    onTouchStart: _onTouchStart,
    onTouchMove: _onTouchMove,
    onTouchEnd: _onTouchEnd,
    onMouseDown: _onMouseDown,
    onMouseMove: _onMouseMove,
    onMouseUp: _onMouseUp,
    setIndex,
  }
}
