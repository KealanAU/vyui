<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Ported from lynx-ui-draggable (React) — gesture logic
     mirrors `useDraggable.tsx` / `Draggable.tsx`. MT worklet shape matches
     SwipeAction / Sortable. -->
<script lang="ts">
export type DraggableAxis = 'x' | 'y' | 'both'

export interface DraggableBounds {
  /** Min X delta from origin (negative = left). */
  left?: number
  /** Max X delta from origin (positive = right). */
  right?: number
  /** Min Y delta from origin (negative = up). */
  top?: number
  /** Max Y delta from origin (positive = down). */
  bottom?: number
}

export interface DraggableProps {
  /** Lock drag to a single axis. `'both'` allows free 2D pan. */
  axis?: DraggableAxis
  /** Disable interaction. */
  disabled?: boolean
  /** Bounds in px relative to the drag origin. Omitted side = unbounded. */
  bounds?: DraggableBounds
  /** Animate back to `(0, 0)` on release. */
  resetOnEnd?: boolean
  /**
   * Reset animation duration in ms. Only used when `resetOnEnd` is `true`.
   * @defaultValue `220`
   */
  duration?: number
  /** Emit `drag-move` on every touchmove. Off by default. */
  emitMove?: boolean
  /**
   * Carry release velocity into a momentum coast: a flick keeps gliding and
   * decelerates to rest (clamped to `bounds`) instead of stopping dead at the
   * finger. Ignored when `resetOnEnd` is `true` (reset wins). Off by default.
   * @defaultValue `false`
   */
  momentum?: boolean
  /**
   * Deceleration rate for `momentum`. Higher = shorter fling. Projected
   * coast distance is `velocity / decel`.
   * @defaultValue `5`
   */
  momentumDecel?: number
}

export interface DraggablePosition {
  /** Current X offset from origin in px. */
  x: number
  /** Current Y offset from origin in px. */
  y: number
}

export interface DragMovePayload extends DraggablePosition {
  /** Delta from touchstart in px (X). */
  dx: number
  /** Delta from touchstart in px (Y). */
  dy: number
}

export interface DragEndPayload extends DragMovePayload {
  /** Release velocity in px/s along X. Positive = rightward. */
  vx: number
  /** Release velocity in px/s along Y. Positive = downward. */
  vy: number
}

export type DraggableEmits = {
  /** Fires on touchstart. Payload is the current `(x, y)` position. */
  dragStart: [DraggablePosition]
  /** Fires on touchmove. Opt in via `emitMove`. */
  dragMove: [DragMovePayload]
  /** Fires on touchend / touchcancel with final position and release velocity. */
  dragEnd: [DragEndPayload]
}
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

const props = withDefaults(defineProps<DraggableProps>(), {
  axis: 'both',
  disabled: false,
  resetOnEnd: false,
  duration: 220,
  emitMove: false,
  momentum: false,
  momentumDecel: 5,
})

const emits = defineEmits<DraggableEmits>()

defineSlots<{
  default?: (props: { dragging: boolean }) => any
}>()

// Neither `runOnMainThread` nor `runOnBackground` may be aliased. SWC's
// worklet transform only rewrites the call site when it sees the literal
// identifier; `const fn = runOnMainThread` defeats detection.

// Bounds use safe-integer sentinels because `undefined` does not reliably
// serialize across the worklet boundary, and Infinity is explicitly called
// out as unsupported in lynx-ui's reference implementation.
const NO_MIN = Number.MIN_SAFE_INTEGER
const NO_MAX = Number.MAX_SAFE_INTEGER

function resolveMin(v: number | undefined): number {
  return typeof v === 'number' ? v : NO_MIN
}
function resolveMax(v: number | undefined): number {
  return typeof v === 'number' ? v : NO_MAX
}

// 0 = both, 1 = x-only, 2 = y-only. Numbers compare faster across worklets
// and avoid the interned-string allocation per touchmove.
function encodeAxis(a: DraggableAxis): 0 | 1 | 2 {
  if (a === 'x') return 1
  if (a === 'y') return 2
  return 0
}

const containerRef = useMainThreadRef<any>(null)

// Position relative to origin. `(0, 0)` = element at its laid-out position.
// Persists across drags so released elements stay where they were dropped.
const currentXRef = useMainThreadRef<number>(0)
const currentYRef = useMainThreadRef<number>(0)
const touchStartXRef = useMainThreadRef<number>(0)
const touchStartYRef = useMainThreadRef<number>(0)
const startXRef = useMainThreadRef<number>(0)
const startYRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)

const axisRef = useMainThreadRef<0 | 1 | 2>(encodeAxis(props.axis))
const disabledRef = useMainThreadRef<boolean>(props.disabled)
const resetOnEndRef = useMainThreadRef<boolean>(props.resetOnEnd)
const durationRef = useMainThreadRef<number>(props.duration)
const emitMoveRef = useMainThreadRef<boolean>(props.emitMove)
const momentumRef = useMainThreadRef<boolean>(props.momentum)
const momentumDecelRef = useMainThreadRef<number>(props.momentumDecel)
const minXRef = useMainThreadRef<number>(resolveMin(props.bounds?.left))
const maxXRef = useMainThreadRef<number>(resolveMax(props.bounds?.right))
const minYRef = useMainThreadRef<number>(resolveMin(props.bounds?.top))
const maxYRef = useMainThreadRef<number>(resolveMax(props.bounds?.bottom))

// Velocity tracker — separate X/Y queues so axis-locked drags still report
// the orthogonal velocity as 0.
const xQueueRef = useMainThreadRef<number[]>([])
const yQueueRef = useMainThreadRef<number[]>([])
const tQueueRef = useMainThreadRef<number[]>([])

// Handle of the in-flight `resetOnEnd` animation. Written only inside MT
// worklets (BG writes to MainThreadRef.current are silently dropped).
const resetAnimRef = useMainThreadRef<any>(null)

// BG-side mirror so the slot's `dragging` prop is reactive.
const draggingState = ref(false)

function _syncConfig(
  axis: 0 | 1 | 2,
  disabled: boolean,
  resetOnEnd: boolean,
  duration: number,
  emitMove: boolean,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  momentum: boolean,
  momentumDecel: number,
) {
  'main thread'
  axisRef.current = axis
  disabledRef.current = disabled
  resetOnEndRef.current = resetOnEnd
  durationRef.current = duration
  emitMoveRef.current = emitMove
  minXRef.current = minX
  maxXRef.current = maxX
  minYRef.current = minY
  maxYRef.current = maxY
  momentumRef.current = momentum
  momentumDecelRef.current = momentumDecel
}

// BG-side assignments to `MainThreadRef.current` are silently dropped by
// vue-lynx (only the constructor transfers a value BG→MT), so prop updates
// must be shipped over as a setter-worklet dispatch.
watch(
  () => [
    props.axis,
    props.disabled,
    props.resetOnEnd,
    props.duration,
    props.emitMove,
    props.bounds?.left,
    props.bounds?.right,
    props.bounds?.top,
    props.bounds?.bottom,
    props.momentum,
    props.momentumDecel,
  ] as const,
  () => {
    runOnMainThread(_syncConfig as any)(
      encodeAxis(props.axis),
      props.disabled,
      props.resetOnEnd,
      props.duration,
      props.emitMove,
      resolveMin(props.bounds?.left),
      resolveMax(props.bounds?.right),
      resolveMin(props.bounds?.top),
      resolveMax(props.bounds?.bottom),
      props.momentum,
      props.momentumDecel,
    )
  },
)

function _setTransform(x: number, y: number) {
  'main thread'
  const el = containerRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translate3d(${x}px, ${y}px, 0)`)
  }
}

function _animateTo(fromX: number, fromY: number, toX: number, toY: number) {
  'main thread'
  const el = containerRef as unknown as {
    current?: {
      animate?(keyframes: any[], options: any): any
      setStyleProperty?(k: string, v: string): void
    }
  }
  currentXRef.current = toX
  currentYRef.current = toY
  if (typeof el.current?.animate === 'function') {
    // Keep the handle: a fill-forwards animation outranks inline style in the
    // cascade, so it must be cancelled before the next drag's transform writes.
    resetAnimRef.current = el.current.animate(
      [
        { transform: `translate3d(${fromX}px, ${fromY}px, 0)` },
        { transform: `translate3d(${toX}px, ${toY}px, 0)` },
      ],
      { duration: durationRef.current, fill: 'forwards', easing: 'ease-out' },
    )
  }
  else if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translate3d(${toX}px, ${toY}px, 0)`)
  }
}

function _clamp(v: number, lo: number, hi: number): number {
  'main thread'
  if (v < lo) return lo
  if (v > hi) return hi
  return v
}

function _pruneQueue(ms: number, minLength: number) {
  'main thread'
  const t = tQueueRef.current
  const x = xQueueRef.current
  const y = yQueueRef.current
  const now = Date.now()
  while (t.length > minLength && t[0] < now - ms) {
    t.shift()
    x.shift()
    y.shift()
  }
}

function _getVelocity(): { vx: number, vy: number } {
  'main thread'
  _pruneQueue(500, 0)
  const t = tQueueRef.current
  const x = xQueueRef.current
  const y = yQueueRef.current
  const { length } = t
  if (length < 2) return { vx: 0, vy: 0 }
  const dt = (t[length - 1] - t[0]) / 1000
  if (dt <= 0) return { vx: 0, vy: 0 }
  return {
    vx: (x[length - 1] - x[0]) / dt,
    vy: (y[length - 1] - y[0]) / dt,
  }
}

function _onTouchStart(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  if (disabledRef.current) return
  const t0 = e.touches[0]
  if (!t0) return

  // Cancel any in-flight resetOnEnd animation: active animations beat inline
  // style in the cascade, so leaving it running would mask this drag's
  // `setStyleProperty('transform', …)` writes. Inline `animation: 'none'`
  // (the Sheet's touchstart stomp) does NOT cancel programmatic `.animate()`
  // animations — only the handle can. Re-assert the current transform so the
  // element doesn't snap to the pre-animation position.
  const anim = resetAnimRef.current
  if (anim && typeof anim.cancel === 'function') {
    anim.cancel()
    resetAnimRef.current = null
    _setTransform(currentXRef.current, currentYRef.current)
  }

  isDraggingRef.current = true
  touchStartXRef.current = t0.clientX
  touchStartYRef.current = t0.clientY
  startXRef.current = currentXRef.current
  startYRef.current = currentYRef.current

  tQueueRef.current = [Date.now()]
  xQueueRef.current = [t0.clientX]
  yQueueRef.current = [t0.clientY]

  runOnBackground(_emitStart as any)(currentXRef.current, currentYRef.current)
}

function _onTouchMove(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  if (!isDraggingRef.current) return
  const t0 = e.touches[0]
  if (!t0) return

  const dx = t0.clientX - touchStartXRef.current
  const dy = t0.clientY - touchStartYRef.current
  const axis = axisRef.current

  let nextX = startXRef.current
  let nextY = startYRef.current
  if (axis !== 2) nextX = _clamp(startXRef.current + dx, minXRef.current, maxXRef.current)
  if (axis !== 1) nextY = _clamp(startYRef.current + dy, minYRef.current, maxYRef.current)

  currentXRef.current = nextX
  currentYRef.current = nextY
  _setTransform(nextX, nextY)

  xQueueRef.current.push(t0.clientX)
  yQueueRef.current.push(t0.clientY)
  tQueueRef.current.push(Date.now())
  _pruneQueue(50, 2)

  if (emitMoveRef.current) {
    runOnBackground(_emitMove as any)(nextX, nextY, nextX - startXRef.current, nextY - startYRef.current)
  }
}

function _onTouchEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  const endX = currentXRef.current
  const endY = currentYRef.current
  const dx = endX - startXRef.current
  const dy = endY - startYRef.current
  const v = _getVelocity()
  const axis = axisRef.current
  // Axis-lock the reported velocity so consumers can trust `vx`/`vy`.
  const vx = axis === 2 ? 0 : v.vx
  const vy = axis === 1 ? 0 : v.vy

  if (resetOnEndRef.current) {
    // Reset wins over momentum: animate back to the origin.
    _animateTo(endX, endY, 0, 0)
  }
  else if (momentumRef.current) {
    // Velocity-projected coast — project where the flick would settle under
    // exponential friction (mirrors physics.ts projectMomentum: pos + v/decel)
    // then clamp to bounds so a fling can't escape the valid range.
    const decel = momentumDecelRef.current
    let toX = endX
    let toY = endY
    if (decel > 0) {
      toX = _clamp(endX + vx / decel, minXRef.current, maxXRef.current)
      toY = _clamp(endY + vy / decel, minYRef.current, maxYRef.current)
    }
    if (toX !== endX || toY !== endY) {
      _animateTo(endX, endY, toX, toY)
    }
  }
  runOnBackground(_emitEnd as any)(endX, endY, dx, dy, vx, vy)
}

function _emitStart(x: number, y: number) {
  draggingState.value = true
  emits('dragStart', { x, y })
}

function _emitMove(x: number, y: number, dx: number, dy: number) {
  emits('dragMove', { x, y, dx, dy })
}

function _emitEnd(x: number, y: number, dx: number, dy: number, vx: number, vy: number) {
  draggingState.value = false
  emits('dragEnd', { x, y, dx, dy, vx, vy })
}

// No BG-side unmount cleanup: the velocity queues live on the main thread
// and die with the element; BG writes to MainThreadRef.current are no-ops.

function reset(animate = true) {
  if (animate) {
    runOnMainThread(_animateTo as any)(currentXRef.current, currentYRef.current, 0, 0)
  }
  else {
    runOnMainThread(_setTransform as any)(0, 0)
  }
}

defineExpose({ reset })
</script>

<template>
  <view
    class="vyui-draggable"
    data-vyui-draggable
    :main-thread-ref="containerRef"
    :main-thread-bindtouchstart="_onTouchStart"
    :main-thread-bindtouchmove="_onTouchMove"
    :main-thread-bindtouchend="_onTouchEnd"
    :main-thread-bindtouchcancel="_onTouchEnd"
  >
    <slot :dragging="draggingState" />
  </view>
</template>
