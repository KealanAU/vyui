<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Ported from `lynx-family/lynx-ui`
     `packages/lynx-ui-swipe-action/src/index.tsx` (Apache 2.0). MT worklet
     plumbing follows the Draggable / Swiper pattern in this repo. -->
<script lang="ts">
export type SwipeActionState = 'closed' | 'open'

export interface SwipeActionProps {
  /** Width of the revealed trailing action panel in px. */
  actionWidth: number
  /** Width of the row in px. Required to compute the commit threshold. */
  rowWidth: number
  /** Controlled open state. Bind with `v-model:open`. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /**
   * Fraction of `actionWidth` the user must drag past (without velocity) to
   * snap open. Range 0–1.
   * @defaultValue `0.5`
   */
  snapThreshold?: number
  /**
   * Fraction of `rowWidth` the user must drag past to fire `commit` instead
   * of just snapping open. Range 0–1.
   * @defaultValue `0.5`
   */
  commitThreshold?: number
  /**
   * Absolute velocity in px/s (leftward) above which a flick fires `commit`
   * regardless of position.
   * @defaultValue `1200`
   */
  commitVelocity?: number
  /**
   * Absolute velocity in px/s for "snap to open" / "snap to closed" override.
   * @defaultValue `400`
   */
  velocityThreshold?: number
  /** Release animation duration in ms. */
  duration?: number
  /** Disable interaction. */
  disabled?: boolean
}

export type SwipeActionEmits = {
  /** Fires when the snap state changes. */
  'update:open': [value: boolean]
  /** Fires after a release that crossed `commitThreshold` or `commitVelocity`. */
  'commit': []
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

import { useStandardVModelOf } from '@/shared/composables'

// NEITHER `runOnMainThread` NOR `runOnBackground` may be aliased. SWC's
// worklet transform only wraps when it sees the literal identifier at the
// call site.

const props = withDefaults(defineProps<SwipeActionProps>(), {
  defaultOpen: false,
  snapThreshold: 0.5,
  commitThreshold: 0.5,
  commitVelocity: 1200,
  velocityThreshold: 400,
  duration: 240,
  disabled: false,
})

const emits = defineEmits<SwipeActionEmits>()

defineSlots<{
  default?: (props: { open: boolean, close: () => void }) => any
  action?: (props: { open: boolean, close: () => void }) => any
}>()

const open = useStandardVModelOf<boolean>(props, 'open', emits)

const rowRef = useMainThreadRef<any>(null)
// Current translateX of the row. 0 = closed; -actionWidth = open. Range
// clamped to [-rowWidth, 0] during drag.
const currentXRef = useMainThreadRef<number>(props.defaultOpen ? -props.actionWidth : 0)
const touchStartXRef = useMainThreadRef<number>(0)
const touchStartYRef = useMainThreadRef<number>(0)
const startXRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
// Handle to the in-flight snap animation. A `fill: 'forwards'` Web Animation
// outranks inline style in the cascade, so the row's `setStyleProperty` writes
// during the NEXT drag are masked until this is cancelled — that was why a
// slow-drag after an open/close animation appeared frozen on-device. Mirrors
// Draggable's `resetAnimRef`.
const snapAnimRef = useMainThreadRef<any>(null)
// Axis lock: 0 = undecided, 1 = horizontal (own the gesture),
// 2 = vertical (yield to list scroll). Resolved once per gesture after the
// finger crosses GESTURE_THRESHOLD, then sticky until release.
const axisLockRef = useMainThreadRef<0 | 1 | 2>(0)

// MT mirrors of BG state.
const actionWidthRef = useMainThreadRef<number>(props.actionWidth)
const rowWidthRef = useMainThreadRef<number>(props.rowWidth)
const snapThresholdRef = useMainThreadRef<number>(props.snapThreshold)
const commitThresholdRef = useMainThreadRef<number>(props.commitThreshold)
const commitVelocityRef = useMainThreadRef<number>(props.commitVelocity)
const velocityThresholdRef = useMainThreadRef<number>(props.velocityThreshold)
const durationRef = useMainThreadRef<number>(props.duration)
const disabledRef = useMainThreadRef<boolean>(props.disabled)

// Velocity tracker.
const positionQueueRef = useMainThreadRef<number[]>([])
const timeQueueRef = useMainThreadRef<number[]>([])

// Timestamp of the last real touch. Touch browsers replay a tap as a
// compatibility mousedown/mouseup pair after touchend; mouse handlers ignore
// events inside this window so a tap doesn't double-run the gesture.
const lastTouchTsRef = useMainThreadRef<number>(0)

watch(() => props.actionWidth, (v) => { actionWidthRef.current = v })
watch(() => props.rowWidth, (v) => { rowWidthRef.current = v })
watch(() => props.snapThreshold, (v) => { snapThresholdRef.current = v })
watch(() => props.commitThreshold, (v) => { commitThresholdRef.current = v })
watch(() => props.commitVelocity, (v) => { commitVelocityRef.current = v })
watch(() => props.velocityThreshold, (v) => { velocityThresholdRef.current = v })
watch(() => props.duration, (v) => { durationRef.current = v })
watch(() => props.disabled, (v) => { disabledRef.current = v })

// External `open` writes animate to the new state (only when not in drag).
watch(open, (isOpen, wasOpen) => {
  if (isOpen === wasOpen) return
  if (isDraggingRef.current) return
  runOnMainThread(_animateTo as any)(isOpen ? -actionWidthRef.current : 0)
})

function _applyTransform(x: number) {
  'main thread'
  const el = rowRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateX(${x}px)`)
  }
}

function _animateTo(targetX: number) {
  'main thread'
  const from = currentXRef.current
  const el = rowRef as unknown as {
    current?: {
      animate?(keyframes: any[], options: any): any
      setStyleProperty?(k: string, v: string): void
    }
  }
  currentXRef.current = targetX
  if (typeof el.current?.animate === 'function') {
    // Write the end state inline BEFORE animating: Lynx web's animation PAPI
    // reads Lynx-style timing keys (fillMode/timingFunction) and silently
    // drops WAAPI fill/easing, so a web settle would otherwise finish
    // fill-less and snap back to the stale drag transform. Both spellings are
    // passed; the inline value is what the element rests on either way.
    _applyTransform(targetX)
    // Keep the handle: a fill-forwards animation outranks inline style in the
    // cascade, so it must be cancelled before the next drag's transform writes.
    snapAnimRef.current = el.current.animate(
      [
        { transform: `translateX(${from}px)` },
        { transform: `translateX(${targetX}px)` },
      ],
      {
        duration: durationRef.current,
        fill: 'forwards',
        fillMode: 'forwards',
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        timingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    )
  }
  else if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateX(${targetX}px)`)
  }
}

function _pruneQueue(ms: number, minLength: number) {
  'main thread'
  const t = timeQueueRef.current
  const p = positionQueueRef.current
  const now = Date.now()
  while (t.length > minLength && t[0] < now - ms) {
    t.shift()
    p.shift()
  }
}

function _getVelocity() {
  'main thread'
  _pruneQueue(500, 0)
  const t = timeQueueRef.current
  const p = positionQueueRef.current
  const { length } = t
  if (length < 2) return 0
  const dt = (t[length - 1] - t[0]) / 1000
  if (dt <= 0) return 0
  return (p[length - 1] - p[0]) / dt
}

function _dragStart(clientX: number, clientY: number) {
  'main thread'
  if (disabledRef.current) return
  // Cancel any in-flight snap animation: a `fill: 'forwards'` animation beats
  // inline style, so leaving it running would mask this drag's
  // `setStyleProperty('transform')` writes. Re-assert the current transform so
  // the row doesn't snap to its pre-animation position.
  const anim = snapAnimRef.current
  if (anim && typeof anim.cancel === 'function') {
    anim.cancel()
    snapAnimRef.current = null
    _applyTransform(currentXRef.current)
  }
  isDraggingRef.current = true
  axisLockRef.current = 0
  touchStartXRef.current = clientX
  touchStartYRef.current = clientY
  startXRef.current = currentXRef.current
  timeQueueRef.current = [Date.now()]
  positionQueueRef.current = [clientX]
}

function _dragMove(clientX: number, clientY: number) {
  'main thread'
  if (!isDraggingRef.current) return
  const x = clientX
  const y = clientY
  const dx = x - touchStartXRef.current
  const dy = y - touchStartYRef.current

  // Axis lock — mirrors physics.ts resolveAxisLock with the horizontal
  // consume cone (±45°). Once the finger travels past the 8px slop we decide,
  // once, whether this gesture is ours (horizontal) or belongs to a vertical
  // list scroll. A vertical gesture is yielded for the rest of the touch so
  // we never fight the surrounding scroller.
  if (axisLockRef.current === 0) {
    const displacement = Math.sqrt(dx * dx + dy * dy)
    // GESTURE_THRESHOLD = 8 (physics.ts).
    if (displacement <= 8) return
    // Horizontal when |dx| >= |dy| (the ±45° cone).
    axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? 1 : 2
  }
  if (axisLockRef.current === 2) return

  let nextX = startXRef.current + dx
  // Clamp: row content can move from -rowWidth to 0. No positive overshoot.
  if (nextX > 0) nextX = 0
  if (nextX < -rowWidthRef.current) nextX = -rowWidthRef.current
  currentXRef.current = nextX
  _applyTransform(nextX)
  positionQueueRef.current.push(x)
  timeQueueRef.current.push(Date.now())
  _pruneQueue(50, 2)
}

function _dragEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  // Gesture was claimed by a vertical scroll — leave the row where it is
  // (it never moved) without forcing a snap or emitting state.
  if (axisLockRef.current === 2) {
    axisLockRef.current = 0
    return
  }
  axisLockRef.current = 0

  const endX = currentXRef.current
  const velocity = _getVelocity()
  const aw = actionWidthRef.current
  const rw = rowWidthRef.current
  const snapAt = snapThresholdRef.current * aw
  const commitAt = commitThresholdRef.current * rw
  const opening = -velocity // positive = leftward flick (revealing)

  // Velocity-aware decision — mirrors physics.ts decideSwipeAction. A hard
  // leftward flick commits; a rightward flick always closes (even past the
  // open threshold); otherwise position + soft-flick decide open vs close.
  if (opening >= commitVelocityRef.current || -endX >= commitAt) {
    _animateTo(-rw)
    runOnBackground(_emitCommit as any)()
    return
  }

  if (velocity >= velocityThresholdRef.current) {
    _animateTo(0)
    runOnBackground(_emitOpen as any)(false)
    return
  }

  if (opening >= velocityThresholdRef.current || -endX >= snapAt) {
    _animateTo(-aw)
    runOnBackground(_emitOpen as any)(true)
    return
  }

  _animateTo(0)
  runOnBackground(_emitOpen as any)(false)
}

function _onTouchStart(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  const t0 = e.touches[0]
  if (!t0) return
  _dragStart(t0.clientX, t0.clientY)
}

function _onTouchMove(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  const t0 = e.touches[0]
  if (!t0) return
  _dragMove(t0.clientX, t0.clientY)
}

function _onTouchEnd() {
  'main thread'
  lastTouchTsRef.current = Date.now()
  _dragEnd()
}

// Desktop web: Lynx web dispatches raw mouse events and never synthesizes
// touch from them, so the same gesture core is bound to mouse. Coordinates
// arrive top-level (mouse `detail` is the DOM click-count number, not
// `{x, y}`). No mouseleave binding — it doesn't bubble, so per-element
// delivery is unreliable on the Lynx dispatch path.
function _onMouseDown(e: { clientX: number, clientY: number, buttons?: number }) {
  'main thread'
  // Swallow the compatibility mousedown a touch browser replays after a tap.
  if (Date.now() - lastTouchTsRef.current < 500) return
  // Primary button only: a right/middle press would start a phantom drag that
  // the next hover move then "releases", teleporting the row.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return
  _dragStart(e.clientX, e.clientY)
}

function _onMouseMove(e: { clientX: number, clientY: number, buttons?: number }) {
  'main thread'
  // Only an EXPLICIT buttons value with the primary bit clear counts as
  // released (recovers the mouseup lost outside the <lynx-view>). A missing
  // `buttons` is treated as still-pressed — trackpad/synthetic moves can omit
  // it, and ending on those lets the drag go mid-gesture.
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

function _emitOpen(next: boolean) {
  if (open.value !== next) open.value = next
}

function _emitCommit() {
  if (open.value) open.value = false
  emits('commit')
}

function close() {
  runOnMainThread(_animateTo as any)(0)
  if (open.value) open.value = false
}

defineExpose({ close })

onMounted(() => {
  if (props.defaultOpen) {
    runOnMainThread(_applyTransform as any)(-props.actionWidth)
  }
})

onUnmounted(() => {
  positionQueueRef.current = []
  timeQueueRef.current = []
})

const slotProps = computed(() => ({ open: open.value, close }))
</script>

<template>
  <view
    class="vyui-swipe-action"
    data-vyui-swipe-action
    :style="{
      position: 'relative',
      width: `${props.rowWidth}px`,
      overflow: 'hidden',
    }"
  >
    <!-- Trailing action panel. Sits beneath the row; revealed as row slides left. -->
    <view
      class="vyui-swipe-action__panel"
      :style="{
        position: 'absolute',
        top: '0',
        right: '0',
        bottom: '0',
        width: `${props.actionWidth}px`,
        display: 'flex',
        flexDirection: 'row',
      }"
    >
      <slot name="action" v-bind="slotProps" />
    </view>
    <!-- Foreground row — the element that gets translated. -->
    <view
      class="vyui-swipe-action__row"
      :main-thread-ref="rowRef"
      :main-thread-bindtouchstart="_onTouchStart"
      :main-thread-bindtouchmove="_onTouchMove"
      :main-thread-bindtouchend="_onTouchEnd"
      :main-thread-bindtouchcancel="_onTouchEnd"
      :main-thread-bindmousedown="_onMouseDown"
      :main-thread-bindmousemove="_onMouseMove"
      :main-thread-bindmouseup="_onMouseUp"
      :style="{
        position: 'relative',
        width: '100%',
        /* No `backgroundColor`: headless. The row must still be OPAQUE so the
           actions behind it don't show through, but that color is the
           consumer's to pick — @vyui/kit's theme puts `bg-default` on this
           slot, which an inline style here would silently outrank (white row
           on a dark page). */
      }"
    >
      <slot v-bind="slotProps" />
    </view>
  </view>
</template>
