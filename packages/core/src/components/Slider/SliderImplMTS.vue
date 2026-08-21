<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     The Slider's only drag implementation. Everything runs on the main
     thread: the track rect is measured once per gesture, each `touchmove`
     worklet computes the next value and paints the active thumb and the filled
     range via `setStyleProperty`. BG sees one round-trip per gesture, on
     `touchend`, which the root commits as a `valueCommit`. -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SliderImplMTSProps extends PrimitiveProps {}

/** Encoded `startEdge` for the MT side — numbers compare faster than strings
 *  across the worklet boundary. 0 left, 1 right, 2 top, 3 bottom. */
type StartEdgeCode = 0 | 1 | 2 | 3

function encodeStartEdge(edge: 'left' | 'right' | 'top' | 'bottom'): StartEdgeCode {
  if (edge === 'left') return 0
  if (edge === 'right') return 1
  if (edge === 'top') return 2
  return 3
}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { runOnBackground, useMainThreadRef } from 'vue-lynx'

import { Primitive } from '@/components/Primitive'
import { injectSliderRootContext } from './SliderRoot.vue'
import { injectSliderOrientationContext } from './utils'

const props = withDefaults(defineProps<SliderImplMTSProps>(), {
  as: 'view',
})

const root = injectSliderRootContext()
const orientation = injectSliderOrientationContext()

// Vitest's vue-lynx harness doesn't run the SWC worklet transform, so the
// `:main-thread-bind*` props arrive as null and `applySetWorkletEvent` throws
// while applying the ops. Bind them only outside the harness.
const mtBound = !(globalThis as any).lynxTestingEnv

const trackRef = useMainThreadRef<any>(null)

// Track geometry, in the pointer's own frame. All four come from ONE
// `invoke('boundingClientRect')` per gesture (see `_beginAt`) — never from
// `layoutchange`, which reports top/left relative to the PAGE while a pointer
// is relative to the VIEWPORT (inside a scroll-view the two drift by the scroll
// offset). Size arrives in the same response, so waiting on a BG
// `layoutchange` -> `runOnMainThread` hop buys nothing and strands the drag on
// Lynx web, where that hop never delivers.
//
// Individual scalar refs because `useMainThreadRef<object>` is less reliable
// across the worklet boundary than primitives — see comment in Sheet.
const rectWRef = useMainThreadRef<number>(0)
const rectHRef = useMainThreadRef<number>(0)
const rectLeftRef = useMainThreadRef<number>(0)
const rectTopRef = useMainThreadRef<number>(0)

// Timestamp of the last real touch: touch browsers replay a tap as a
// compatibility mousedown/mouseup pair, which mouse handlers ignore.
const lastTouchTsRef = useMainThreadRef<number>(0)

// 0 = horizontal (read the touch x offset, paint the left/right anchor), 1 = vertical.
const axisRef = useMainThreadRef<0 | 1>(orientation.size === 'width' ? 0 : 1)
const startEdgeRef = useMainThreadRef<StartEdgeCode>(encodeStartEdge(orientation.startEdge.value))

watch(() => orientation.startEdge.value, (v) => {
  startEdgeRef.current = encodeStartEdge(v)
})

const activeIndexRef = useMainThreadRef<number>(-1)

// Thumb + range elements, resolved ON the main thread from the track's own
// subtree: pushing element handles from each `SliderThumbImpl` on mount runs on
// BG, where `MainThreadRef.current` assignment is a silent no-op.
//
// A CLASS selector, not `[data-vyui-slider-thumb]` — Lynx's selector engine is
// a narrow subset and class matching is the part it supports.
const thumbElsRef = useMainThreadRef<any[]>([])
const rangeElRef = useMainThreadRef<any>(null)

// Drag shield — WEB ONLY, and rendered nowhere else.
//
// Lynx web re-targets pointer events by position (same root cause as the
// `zIndex` in SortableItem), and the slider's box is barely thicker than its
// track, so a mouse drag stranded the moment the cursor drifted off it. A
// viewport-sized element raised for the length of the gesture keeps the cursor
// over a bound element. Lynx native gets neither the element nor its bindings:
// it delivers the whole gesture to the node the press started on, and a stuck
// full-screen view there would eat every touch in the app.
//
// Read at render, not setup — `SystemInfo` can resolve late.
function isWeb() {
  return (globalThis.SystemInfo?.platform as string) === 'web'
}

const shieldRef = useMainThreadRef<any>(null)

function _resolveEls() {
  'main thread'
  const track = trackRef.current
  if (!track || typeof track.querySelectorAll !== 'function') return
  // The wrapper method exists on every platform, but calls through to a
  // `__QuerySelectorAll` PAPI that Lynx web does NOT expose to the main-thread
  // realm, so a `typeof` check can't see the failure. Swallowing is safe: these
  // elements only drive the MT paint, a latency optimisation over the
  // background's own render.
  try {
    const els = track.querySelectorAll('.vyui-slider-thumb')
    if (els && els.length > 0) thumbElsRef.current = els
    if (typeof track.querySelector === 'function')
      rangeElRef.current = track.querySelector('.vyui-slider-range')
  }
  catch (_err) {
    // No MT paint targets on this platform; the drag still runs BG-painted.
  }
}

/** Snap `v` to `step` and clamp to `[min, max]`. */
function _snapClamp(v: number, min: number, max: number, step: number): number {
  'main thread'
  let out = v
  if (step > 0) {
    out = Math.round((out - min) / step) * step + min
  }
  if (out < min) out = min
  if (out > max) out = max
  return out
}

/**
 * Convert an ELEMENT-RELATIVE pointer offset into a logical value, snapped and
 * clamped. Only the track's SIZE is involved — never a stored position.
 */
function _valueFromTouch(localX: number, localY: number): number {
  'main thread'
  let local: number
  let extent: number
  if (axisRef.current === 0) {
    local = localX
    extent = rectWRef.current
  }
  else {
    local = localY
    extent = rectHRef.current
  }
  if (extent <= 0) return root.minMT.current
  let frac = local / extent
  if (frac < 0) frac = 0
  if (frac > 1) frac = 1
  // RTL-horizontal (right) and natural-vertical (bottom) flip the fraction so
  // the touch maps to the axis the user thinks they're dragging along.
  const edge = startEdgeRef.current
  if (edge === 1 || edge === 3) frac = 1 - frac
  const min = root.minMT.current
  const max = root.maxMT.current
  const raw = min + frac * (max - min)
  return _snapClamp(raw, min, max, root.stepMT.current)
}

/**
 * Move thumb `idx` to `value` and re-sort: thumbs may cross, and the array is
 * kept monotonically increasing so range fill and `valueCommit` stay coherent.
 */
function _applyValue(values: number[], idx: number, value: number): number[] {
  'main thread'
  const next: number[] = []
  for (let i = 0; i < values.length; i++) next.push(i === idx ? value : values[i])
  next.sort((a, b) => a - b)
  return next
}

/**
 * `minStepsBetweenThumbs`, enforced per frame rather than at commit time: a
 * violating frame is dropped so the thumb stops dead at the limit instead of
 * painting past it and snapping back on release.
 */
function _hasMinGap(vals: number[], gap: number): boolean {
  'main thread'
  if (gap <= 0) return true
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] - vals[i - 1] < gap) return false
  }
  return true
}

/** Pick the thumb closest to `target` value. Single-thumb returns 0. */
function _pickClosestIndex(target: number): number {
  'main thread'
  const arr = root.valuesMT.current
  if (arr.length <= 1) return 0
  let bestIdx = 0
  let bestDist = Math.abs(arr[0] - target)
  for (let i = 1; i < arr.length; i++) {
    const d = Math.abs(arr[i] - target)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx
}

/** `startEdge` code -> the CSS property the thumb and range anchor on. */
function _edgeName(edge: StartEdgeCode): string {
  'main thread'
  if (edge === 0) return 'left'
  if (edge === 1) return 'right'
  if (edge === 2) return 'top'
  return 'bottom'
}

/**
 * Paint the active thumb at its value.
 *
 * Writes the SAME anchor property the background style computes
 * (`[startEdge]: <pct>%`) rather than a delta from a frozen anchor, which would
 * double-count once the background re-anchors mid-gesture. Both threads
 * converge on the same declaration and the last writer wins, so there is
 * nothing to unwind on touchend.
 */
function _paintActiveThumb(value: number) {
  'main thread'
  const idx = activeIndexRef.current
  if (idx < 0) return
  const els = thumbElsRef.current
  if (idx >= els.length) return
  const el = els[idx] as { setStyleProperty?: (k: string, v: string) => void } | null
  if (!el?.setStyleProperty) return

  const min = root.minMT.current
  const max = root.maxMT.current
  const range = max - min
  if (range <= 0) return

  let pct = ((value - min) / range) * 100
  if (pct < 0) pct = 0
  if (pct > 100) pct = 100
  el.setStyleProperty(_edgeName(startEdgeRef.current), `${pct}%`)
}

/**
 * Repaint the filled range from the MT-side values — the BG only learns the new
 * value on `touchend`, so without this the fill sat frozen for the whole
 * gesture. Writes the same two edge offsets `SliderRange`'s BG style computes,
 * so the commit's re-render lands on identical values.
 */
function _paintRange(vals: number[]) {
  'main thread'
  const el = rangeElRef.current as { setStyleProperty?: (k: string, v: string) => void } | null
  if (!el?.setStyleProperty) return
  const min = root.minMT.current
  const max = root.maxMT.current
  const span = max - min
  if (span <= 0) return

  // Mirrors `convertValueToPercentage` + SliderRange's offset math: a single
  // thumb always fills from the start edge, multi-thumb spans lowest..highest.
  let lo = 100
  let hi = 0
  for (let i = 0; i < vals.length; i++) {
    let pct = ((vals[i] - min) / span) * 100
    if (pct < 0) pct = 0
    if (pct > 100) pct = 100
    if (pct < lo) lo = pct
    if (pct > hi) hi = pct
  }
  if (vals.length <= 1) lo = 0

  // The range's end edge is always the opposite side of its start edge.
  const edge = startEdgeRef.current
  const startName = _edgeName(edge)
  const endName = _edgeName(edge === 0 ? 1 : edge === 1 ? 0 : edge === 2 ? 3 : 2)
  el.setStyleProperty(startName, `${lo}%`)
  el.setStyleProperty(endName, `${100 - hi}%`)
}

function _setShield(up: boolean) {
  'main thread'
  const el = shieldRef.current as { setStyleProperty?: (k: string, v: string) => void } | null
  if (!el?.setStyleProperty) return
  el.setStyleProperty('display', up ? 'flex' : 'none')
}

// Coordinate-based gesture cores — take ELEMENT-LOCAL offsets: viewport
// coordinate minus the track origin `_beginAt` captured for this gesture.

function _dragStart(localX: number, localY: number) {
  'main thread'
  if (root.disabledMT.current) return
  // Zero-extent track — bail instead of starting a gesture, `_valueFromTouch`
  // would map every coordinate to `min`.
  if ((axisRef.current === 0 ? rectWRef.current : rectHRef.current) <= 0) return
  // Thumb/range elements are resolved lazily: the first touch is guaranteed to
  // land after the subtree is painted, whereas mount time is not. Deliberately
  // NOT a gate — Lynx web can't run the query at all (see `_resolveEls`), and
  // the paints below no-op safely on an empty registry.
  if (thumbElsRef.current.length === 0) _resolveEls()
  const value = _valueFromTouch(localX, localY)
  const idx = _pickClosestIndex(value)
  activeIndexRef.current = idx
  // The main thread owns the values for the length of the gesture, so the
  // root's `_setValues` push is gated off this — otherwise the live
  // `update:modelValue` echoes back and stomps a newer MT value.
  root.draggingMT.current = true
  const src = root.valuesMT.current
  const next = _applyValue(src, idx, value)
  if (!_hasMinGap(next, root.minGapMT.current)) return
  // Re-track after the sort: the grabbed thumb may have moved position in the
  // array. `indexOf` matches the old BG path, ties included.
  activeIndexRef.current = next.indexOf(value)
  root.valuesMT.current = next
  _paintActiveThumb(value)
  _paintRange(next)
  runOnBackground(_emitLive as any)(next)
}

function _dragMove(localX: number, localY: number) {
  'main thread'
  if (activeIndexRef.current === -1) return
  const value = _valueFromTouch(localX, localY)
  const idx = activeIndexRef.current
  const src = root.valuesMT.current
  const next = _applyValue(src, idx, value)
  // Dropping the frame leaves the thumb parked at the last legal position.
  if (!_hasMinGap(next, root.minGapMT.current)) return
  activeIndexRef.current = next.indexOf(value)
  root.valuesMT.current = next
  _paintActiveThumb(value)
  _paintRange(next)
  runOnBackground(_emitLive as any)(next)
}

function _dragEnd() {
  'main thread'
  // Ahead of the guard: a press that never became a drag (disabled root, zero
  // extent) still raised the shield, and a stuck shield eats the whole page.
  _setShield(false)
  if (activeIndexRef.current === -1) return
  // Already sorted and gap-checked by `_applyValue` every frame, so this is
  // exactly what the commit will write.
  const src = root.valuesMT.current
  const finalVals: number[] = []
  for (let i = 0; i < src.length; i++) finalVals.push(src[i])
  _paintRange(finalVals)
  activeIndexRef.current = -1
  root.draggingMT.current = false
  runOnBackground(_commit as any)(finalVals)
}

/**
 * Open a gesture at a VIEWPORT coordinate: measure the track, then hand the
 * cores the element-local offset.
 *
 * One entry point for touch and mouse because `clientX`/`clientY` is the only
 * pointer field Lynx reports on both platforms. `touches[0].x`/`.y` arrive
 * element-relative on native but do not exist on web at all, so those offsets
 * came through as `NaN` on any touchscreen browser.
 *
 * `boundingClientRect` is the single source for BOTH origin and extent — Lynx's
 * main-thread `Element` has no synchronous rect API — and is fetched per
 * gesture so scrolling or a resize can't skew it. It resolves on the microtask
 * queue, ahead of the next move event; one that lands first is dropped by
 * `_dragMove`'s `activeIndexRef === -1` guard.
 */
function _beginAt(clientX: number, clientY: number) {
  'main thread'
  const track = trackRef.current
  if (!track || typeof track.invoke !== 'function') return
  track
    .invoke('boundingClientRect')
    .then((r: { left: number, top: number, width: number, height: number }) => {
      rectLeftRef.current = r.left
      rectTopRef.current = r.top
      rectWRef.current = r.width
      rectHRef.current = r.height
      _dragStart(clientX - r.left, clientY - r.top)
    })
    // A missing UI method drops the gesture rather than raising.
    .catch(() => {})
}

// The template's `hit-slop` / `consume-slide-event` are the native forgiveness
// knobs (Lynx web ignores both): slop because the element is only as thick as
// the track, consume because an ancestor `<scroll-view>` otherwise claims the
// gesture the moment the finger drifts off-axis.

function _onTouchStart(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  const t = e.touches[0]
  if (!t) return
  _beginAt(t.clientX, t.clientY)
}

function _onTouchMove(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  const t = e.touches[0]
  if (!t) return
  _dragMove(t.clientX - rectLeftRef.current, t.clientY - rectTopRef.current)
}

function _onTouchEnd() {
  'main thread'
  lastTouchTsRef.current = Date.now()
  _dragEnd()
}

// Desktop web: Lynx web dispatches raw mouse events and never synthesizes
// touch from them. Coordinates arrive top-level (mouse `detail` is the
// click-count number) in the same viewport frame the touch path uses. No
// mouseleave binding — it doesn't bubble, so per-element delivery is unreliable
// on the Lynx dispatch path.
function _onMouseDown(e: { clientX: number, clientY: number, buttons?: number }) {
  'main thread'
  // Swallow the compatibility mousedown a touch browser replays after a tap.
  if (Date.now() - lastTouchTsRef.current < 500) return
  // Primary button only: a right/middle press would start a phantom drag that
  // the next hover move then "releases", teleporting the thumb.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return
  // Synchronously, not from `_beginAt`'s `boundingClientRect` continuation —
  // the cursor can already be off the element by the time that resolves.
  _setShield(true)
  _beginAt(e.clientX, e.clientY)
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
  _dragMove(e.clientX - rectLeftRef.current, e.clientY - rectTopRef.current)
}

function _onMouseUp() {
  'main thread'
  _dragEnd()
}

// BG callbacks — invoked from the touch worklets. Cannot be aliased; see the
// worklet-transform notes in Draggable.

/**
 * Per-frame `update:modelValue`. Costs one background hop per touchmove and
 * nothing waits on it, but a consumer rendering the number needs it.
 */
function _emitLive(values: number[]) {
  root.updateFromMT(values)
}

/** Final value of the gesture — the one that also emits `valueCommit`. */
function _commit(values: number[]) {
  root.commitFromMT(values)
}
</script>

<template>
  <Primitive
    data-vyui-slider-impl
    v-bind="props"
    hit-slop="16px"
    :consume-slide-event="[[0, 360]]"
    :main-thread-ref="mtBound ? trackRef : undefined"
    :main-thread-bindtouchstart="mtBound ? _onTouchStart : undefined"
    :main-thread-bindtouchmove="mtBound ? _onTouchMove : undefined"
    :main-thread-bindtouchend="mtBound ? _onTouchEnd : undefined"
    :main-thread-bindtouchcancel="mtBound ? _onTouchEnd : undefined"
    :main-thread-bindmousedown="mtBound ? _onMouseDown : undefined"
    :main-thread-bindmousemove="mtBound ? _onMouseMove : undefined"
    :main-thread-bindmouseup="mtBound ? _onMouseUp : undefined"
  >
    <slot />
    <view
      v-if="mtBound && isWeb()"
      data-vyui-slider-shield
      style="display: none; position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; z-index: 9999;"
      :main-thread-ref="shieldRef"
      :main-thread-bindmousemove="_onMouseMove"
      :main-thread-bindmouseup="_onMouseUp"
    />
  </Primitive>
</template>
