<!-- vyui original. Swipe-to-dismiss layer for a toast, modeled on the MT
     worklet plumbing in `SwipeAction.vue` (Apache 2.0) and the Swiper/Sheet
     pattern in this repo.

     Why a separate element (not on the toast root): a stacked/Sonner toast
     already carries a reactive `transform` (translate + scale) on its root.
     A swipe must drive `transform` on the MAIN thread, and the single
     `transform` property can't be owned by both the BG reactive style and an
     MT worklet at once — they clobber each other. So the card visual sits on
     THIS inner layer, which the worklet translates, while the stacking
     transform stays on the outer shell the consumer renders. -->
<script lang="ts">
export interface ToastSwipeProps {
  /**
   * Which drag directions dismiss the toast. `horizontal` (default) lets the
   * user fling either way; `left` / `right` constrain it to one side.
   */
  direction?: 'horizontal' | 'left' | 'right'
  /** Fraction of the toast width a drag must pass (without a flick) to dismiss. */
  threshold?: number
  /** px/s flick speed above which a release dismisses regardless of distance. */
  velocityThreshold?: number
  /** Snap-back / fling animation duration in ms. */
  duration?: number
  /** Disable the gesture. */
  disabled?: boolean
}

export type ToastSwipeEmits = {
  /** Fired (on BG) once a release crosses the dismiss threshold or velocity. */
  dismiss: []
}

/**
 * Pure release decision the release worklet runs — kept module-level so the
 * dismiss math is unit-testable without rendering (worklets don't run under
 * vitest). Mirrors the inline body of `_dragEnd`.
 */
export function decideDismiss(opts: {
  endX: number
  velocity: number
  width: number
  direction: 'horizontal' | 'left' | 'right'
  threshold: number
  velocityThreshold: number
}): boolean {
  // Only count motion in an allowed direction.
  if (opts.direction === 'left' && opts.endX > 0) return false
  if (opts.direction === 'right' && opts.endX < 0) return false
  const flicked = Math.abs(opts.velocity) >= opts.velocityThreshold
  // Distance can only dismiss once the width is known (it seeds the fraction).
  const dragged = opts.width > 0 && Math.abs(opts.endX) >= opts.threshold * opts.width
  return flicked || dragged
}
</script>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'
import { injectToastRootContext } from './ToastRoot.vue'

// NEITHER `runOnMainThread` NOR `runOnBackground` may be aliased — SWC's
// worklet transform only wraps the literal identifier at the call site.

const props = withDefaults(defineProps<ToastSwipeProps>(), {
  direction: 'horizontal',
  threshold: 0.45,
  velocityThreshold: 600,
  duration: 200,
  disabled: false,
})

const emits = defineEmits<ToastSwipeEmits>()

defineSlots<{ default?: () => any }>()

// A swipe past threshold dismisses the surrounding toast.
const toast = injectToastRootContext()

const rowRef = useMainThreadRef<any>(null)
const currentXRef = useMainThreadRef<number>(0)
const touchStartXRef = useMainThreadRef<number>(0)
const startXRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
// Measured toast width — seeds the fraction-based dismiss threshold and the
// fling distance. 0 until the first layout, so before then only a flick
// (velocity) can dismiss.
const widthRef = useMainThreadRef<number>(0)

// MT mirrors of BG config. Seeded through the constructor (the only reliable
// BG→MT transfer in vue-lynx@0.4.0 — a later `.current` write from BG is
// dropped). These props are fixed per toast instance, so no runtime sync is
// needed; the worklets read them MT-locally.
const directionRef = useMainThreadRef<string>(props.direction)
const thresholdRef = useMainThreadRef<number>(props.threshold)
const velocityThresholdRef = useMainThreadRef<number>(props.velocityThreshold)
const durationRef = useMainThreadRef<number>(props.duration)
const disabledRef = useMainThreadRef<boolean>(props.disabled)

const positionQueueRef = useMainThreadRef<number[]>([])
const timeQueueRef = useMainThreadRef<number[]>([])

// Handle of the in-flight snap/fling animation. A fill-forwards animation
// outranks inline style in the cascade, so it must be cancelled before the
// next drag's transform writes (mirrors SwipeAction's `snapAnimRef`).
const snapAnimRef = useMainThreadRef<any>(null)

// Timestamp of the last real touch. Touch browsers replay a tap as a
// compatibility mousedown/mouseup pair after touchend; mouse handlers ignore
// events inside this window so a tap doesn't double-run the gesture.
const lastTouchTsRef = useMainThreadRef<number>(0)

// IMPORTANT — worklet ordering: the worklet transform rewrites each
// `'main thread'` function into a `const` binding, so a worklet may only
// reference helper worklets DEFINED ABOVE it (a forward reference throws
// "lexical variable is not initialized" at registration). Keep helpers
// (`_setWidth`, `_apply`, `_opacityFor`, `_pruneQueue`, `_getVelocity`) above
// their callers; only the BG callback `_emitDismiss` may sit below (it's a
// plain function, hoisted, dispatched via `runOnBackground`).

function _setWidth(v: number) { 'main thread'; widthRef.current = v }

// BG layout handler → push measured width to the MT ref (width is dynamic, so
// unlike the static config it must hop after mount, not via the constructor).
function onRowLayout(e: { detail?: { width?: number } } | undefined) {
  const w = e?.detail?.width
  if (typeof w === 'number' && w > 0) runOnMainThread(_setWidth as any)(w)
}

function _apply(x: number, opacity: number) {
  'main thread'
  const el = rowRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateX(${x}px)`)
    el.current.setStyleProperty('opacity', `${opacity}`)
  }
}

// Opacity ramps from 1 (centered) toward 0.2 as the card nears its own width.
// Defined ABOVE `_animateTo` / `_onTouchMove` so those worklets can call it.
function _opacityFor(x: number) {
  'main thread'
  const w = widthRef.current
  if (w <= 0) return 1
  const ratio = Math.abs(x) / w
  const faded = 1 - ratio * 0.8
  return faded < 0.2 ? 0.2 : faded
}

function _animateTo(targetX: number, targetOpacity: number) {
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
    _apply(targetX, targetOpacity)
    // Keep the handle: a fill-forwards animation outranks inline style in the
    // cascade, so it must be cancelled before the next drag's transform writes.
    snapAnimRef.current = el.current.animate(
      [
        { transform: `translateX(${from}px)`, opacity: `${_opacityFor(from)}` },
        { transform: `translateX(${targetX}px)`, opacity: `${targetOpacity}` },
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
  else {
    _apply(targetX, targetOpacity)
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

function _dragStart(clientX: number) {
  'main thread'
  if (disabledRef.current) return
  // Cancel any in-flight snap-back animation: a `fill: 'forwards'` animation
  // beats inline style, so leaving it running would mask this drag's
  // `setStyleProperty` writes. Re-assert the current state so the card doesn't
  // jump to its pre-animation position.
  const anim = snapAnimRef.current
  if (anim && typeof anim.cancel === 'function') {
    anim.cancel()
    snapAnimRef.current = null
    _apply(currentXRef.current, _opacityFor(currentXRef.current))
  }
  isDraggingRef.current = true
  touchStartXRef.current = clientX
  startXRef.current = currentXRef.current
  timeQueueRef.current = [Date.now()]
  positionQueueRef.current = [clientX]
}

function _dragMove(clientX: number) {
  'main thread'
  if (!isDraggingRef.current) return
  const x = clientX
  const dx = x - touchStartXRef.current
  let nextX = startXRef.current + dx
  const dir = directionRef.current
  // Clamp to the allowed half-line (with a little rubber-band past 0).
  if (dir === 'left' && nextX > 0) nextX = 0
  if (dir === 'right' && nextX < 0) nextX = 0
  currentXRef.current = nextX
  _apply(nextX, _opacityFor(nextX))
  positionQueueRef.current.push(x)
  timeQueueRef.current.push(Date.now())
  _pruneQueue(50, 2)
}

function _dragEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  const endX = currentXRef.current
  const velocity = _getVelocity()
  const w = widthRef.current
  const dir = directionRef.current

  // Inline mirror of `decideDismiss` (worklets can't call across files).
  let allowed = true
  if (dir === 'left' && endX > 0) allowed = false
  if (dir === 'right' && endX < 0) allowed = false
  const flicked = Math.abs(velocity) >= velocityThresholdRef.current
  const dragged = w > 0 && Math.abs(endX) >= thresholdRef.current * w

  if (allowed && (flicked || dragged)) {
    // Fling off-screen in the drag's direction, fade out, then dismiss.
    const sign = endX === 0 ? (velocity < 0 ? -1 : 1) : (endX < 0 ? -1 : 1)
    const flingTo = sign * (w > 0 ? w * 1.2 : 500)
    _animateTo(flingTo, 0)
    runOnBackground(_emitDismiss as any)()
    return
  }

  // Snap back to rest.
  _animateTo(0, 1)
}

function _onTouchStart(e: { touches: Array<{ clientX: number }> }) {
  'main thread'
  const t0 = e.touches[0]
  if (!t0) return
  _dragStart(t0.clientX)
}

function _onTouchMove(e: { touches: Array<{ clientX: number }> }) {
  'main thread'
  const t0 = e.touches[0]
  if (!t0) return
  _dragMove(t0.clientX)
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
function _onMouseDown(e: { clientX: number, buttons?: number }) {
  'main thread'
  // Swallow the compatibility mousedown a touch browser replays after a tap.
  if (Date.now() - lastTouchTsRef.current < 500) return
  // Primary button only: a right/middle press would start a phantom drag that
  // the next hover move then "releases", flinging the toast.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return
  _dragStart(e.clientX)
}

function _onMouseMove(e: { clientX: number, buttons?: number }) {
  'main thread'
  // Only an EXPLICIT buttons value with the primary bit clear counts as
  // released (recovers the mouseup lost outside the <lynx-view>). A missing
  // `buttons` is treated as still-pressed — trackpad/synthetic moves can omit
  // it, and ending on those lets the drag go mid-gesture.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) {
    _dragEnd()
    return
  }
  _dragMove(e.clientX)
}

function _onMouseUp() {
  'main thread'
  _dragEnd()
}

function _emitDismiss() {
  emits('dismiss')
  toast.onClose()
}

onUnmounted(() => {
  positionQueueRef.current = []
  timeQueueRef.current = []
})
</script>

<template>
  <view
    :main-thread-ref="rowRef"
    :main-thread-bindtouchstart="_onTouchStart"
    :main-thread-bindtouchmove="_onTouchMove"
    :main-thread-bindtouchend="_onTouchEnd"
    :main-thread-bindtouchcancel="_onTouchEnd"
    :main-thread-bindmousedown="_onMouseDown"
    :main-thread-bindmousemove="_onMouseMove"
    :main-thread-bindmouseup="_onMouseUp"
    @layoutchange="onRowLayout"
  >
    <slot />
  </view>
</template>
