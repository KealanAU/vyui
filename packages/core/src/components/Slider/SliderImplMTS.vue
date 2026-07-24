<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     The Slider's only drag implementation. Everything runs on the main
     thread: the track rect is cached in MT refs (measured on the BG from
     `@layoutchange`), each `touchmove` worklet computes the next value, snaps
     to `step`, and paints the active thumb's transform and the filled range
     directly via `setStyleProperty`. BG only sees one round-trip per gesture —
     on `touchend` — which the root commits as a `valueCommit`.

     A background-thread implementation used to sit alongside this one, driving
     the drag through per-frame `update:modelValue`. It was removed in 2026-07:
     it measured correctly but felt worse than the worklet path on device, and
     keeping both meant every fix landed twice. Keyboard stepping (arrow / home
     / end) went with it — those handlers never fired on Lynx native, which has
     no key events to bind. -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SliderImplMTSProps extends PrimitiveProps {}

/** Encoded `startEdge` for the MT side — strings cross worklet boundaries
 *  but numbers compare faster and avoid an interned-string allocation per
 *  touchmove. 0 left, 1 right, 2 top, 3 bottom. */
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
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

import { Primitive } from '@/components/Primitive'
import { useResizeObserver } from '@/shared/composables'
import { injectSliderRootContext } from './SliderRoot.vue'
import { injectSliderOrientationContext } from './utils'

const props = withDefaults(defineProps<SliderImplMTSProps>(), {
  as: 'view',
})

const root = injectSliderRootContext()
const orientation = injectSliderOrientationContext()

// Vitest's vue-lynx harness doesn't run the SWC worklet transform, so the
// `:main-thread-bind*` props arrive as null and `applySetWorkletEvent` throws
// while applying the ops. Bind them only outside the harness — the component
// still mounts and renders there, but the drag itself is device-only.
const mtBound = !(globalThis as any).lynxTestingEnv

const trackRef = useMainThreadRef<any>(null)

// Track rect in PAGE coordinates, refreshed on `layoutchange`. Stored as
// individual scalar refs because `useMainThreadRef<object>` is less reliable
// across the worklet boundary than primitives — see comment in Sheet.
const rectXRef = useMainThreadRef<number>(0)
const rectYRef = useMainThreadRef<number>(0)
const rectWRef = useMainThreadRef<number>(0)
const rectHRef = useMainThreadRef<number>(0)

// 0 = horizontal (read pageX, paint translateX), 1 = vertical.
const axisRef = useMainThreadRef<0 | 1>(orientation.size === 'width' ? 0 : 1)
const startEdgeRef = useMainThreadRef<StartEdgeCode>(encodeStartEdge(orientation.startEdge.value))

watch(() => orientation.startEdge.value, (v) => {
  startEdgeRef.current = encodeStartEdge(v)
})

const activeIndexRef = useMainThreadRef<number>(-1)
// Snapshot of all thumb values at touchstart — used to compute each thumb's
// stable BG-anchor position so paint deltas are relative to it.
const startValuesRef = useMainThreadRef<number[]>([])

// Lynx's main-thread `Element` has no `getBoundingClientRect` (see
// `@lynx-js/types` main-thread/element.d.ts — the MT surface is
// get/setAttribute, setStyleProperty, querySelector, invoke, animate), so the
// track has to be measured on the BG and pushed across. Same shape Sheet uses
// for its panel extent: BG `@layoutchange` -> `runOnMainThread` setter, since
// plain BG writes to `MainThreadRef.current` are silently dropped. The
// dispatch is post-mount, so it can't hit the setup-time MT-ref registration
// race.
//
// `layoutchange` reports position relative to the PAGE, which is why the touch
// worklets read `pageX`/`pageY` rather than `clientX`/`clientY` — the two
// differ once an ancestor scrolls (FeedList's PTR worklets read `pageY` for
// the same reason).
function _setRect(x: number, y: number, w: number, h: number) {
  'main thread'
  rectXRef.current = x
  rectYRef.current = y
  rectWRef.current = w
  rectHRef.current = h
}

const { onLayoutChange } = useResizeObserver((r) => {
  void runOnMainThread(_setRect as any)(r.left, r.top, r.width, r.height)
})

// Thumb + range elements, resolved ON the main thread from the track's own
// subtree.
//
// The obvious alternative — having each `SliderThumbImpl` push its element
// handle into a shared `MainThreadRef` on mount — is what this component used
// to do, and it never worked: that push runs on the background thread, where
// `MainThreadRef.current` assignment is a silent no-op, so the list was always
// empty and the paint below never ran. Resolving from MT sidesteps the thread
// boundary entirely, and also dodges the mount-time race between a
// `runOnMainThread` dispatch and MT-ref registration.
//
// A CLASS selector, not `[data-vyui-slider-thumb]` — Lynx's selector engine is
// a narrow subset and class matching is the part everything else in the repo
// leans on.
const thumbElsRef = useMainThreadRef<any[]>([])
const rangeElRef = useMainThreadRef<any>(null)

function _resolveEls() {
  'main thread'
  const track = trackRef.current
  if (!track || typeof track.querySelectorAll !== 'function') return
  const els = track.querySelectorAll('.vyui-slider-thumb')
  if (els && els.length > 0) thumbElsRef.current = els
  if (typeof track.querySelector === 'function')
    rangeElRef.current = track.querySelector('.vyui-slider-range')
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

/** Convert a touch coordinate into a logical value, snapped + clamped. */
function _valueFromTouch(touchX: number, touchY: number): number {
  'main thread'
  let local: number
  let extent: number
  if (axisRef.current === 0) {
    local = touchX - rectXRef.current
    extent = rectWRef.current
  }
  else {
    local = touchY - rectYRef.current
    extent = rectHRef.current
  }
  if (extent <= 0) return root.minMT.current
  let frac = local / extent
  if (frac < 0) frac = 0
  if (frac > 1) frac = 1
  // startEdge: 0 left, 1 right, 2 top, 3 bottom. RTL-horizontal (right) and
  // natural-vertical (bottom) flip the fraction so the touch maps to the
  // axis the user thinks they're dragging along.
  const edge = startEdgeRef.current
  if (edge === 1 || edge === 3) frac = 1 - frac
  const min = root.minMT.current
  const max = root.maxMT.current
  const raw = min + frac * (max - min)
  return _snapClamp(raw, min, max, root.stepMT.current)
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

/**
 * Paint the active thumb's transform to its current value position. The BG
 * anchor (`[startEdge]: calc(% + offset)`) stays at the touchstart value
 * during the drag, so we translate by the px delta from that anchor and
 * compose the original centering (`translateX(-50%)` / `translateY(±50%)`)
 * onto the same `transform` declaration.
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

  const startValue = startValuesRef.current[idx] ?? value
  const startPct = (startValue - min) / range
  const curPct = (value - min) / range
  const dPct = curPct - startPct

  const edge = startEdgeRef.current
  if (axisRef.current === 0) {
    // Horizontal — startEdge is left (0) or right (1). Right-anchored
    // (RTL / inverted) needs an inverted sign because increasing `right`
    // moves the element left on screen.
    const signX = edge === 0 ? 1 : -1
    const dPx = signX * dPct * rectWRef.current
    el.setStyleProperty('transform', `translateX(${dPx}px) translateX(-50%)`)
  }
  else {
    // Vertical — startEdge is top (2) or bottom (3). Bottom-anchored
    // (natural) needs an inverted sign for the same reason, plus a flipped
    // centering offset.
    const signY = edge === 2 ? 1 : -1
    const dPy = signY * dPct * rectHRef.current
    const center = edge === 3 ? '50%' : '-50%'
    el.setStyleProperty('transform', `translateY(${dPy}px) translateY(${center})`)
  }
}

/**
 * Repaint the filled range from the MT-side values.
 *
 * The BG only learns the new value on `touchend`, so without this the fill —
 * the part of the control that actually reads as "the value" — sat frozen for
 * the whole gesture and snapped on release while the thumb glided.
 *
 * Writes the same two edge offsets `SliderRange`'s BG style computes, so the
 * commit's re-render lands on identical values and there is nothing to reset.
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

  // startEdge codes: 0 left, 1 right, 2 top, 3 bottom — the range's end edge is
  // always the opposite side.
  const edge = startEdgeRef.current
  const startName = edge === 0 ? 'left' : edge === 1 ? 'right' : edge === 2 ? 'top' : 'bottom'
  const endName = edge === 0 ? 'right' : edge === 1 ? 'left' : edge === 2 ? 'bottom' : 'top'
  el.setStyleProperty(startName, `${lo}%`)
  el.setStyleProperty(endName, `${100 - hi}%`)
}

/**
 * Reset the active thumb's transform to its BG-side centering. Called on
 * touchend so the next BG render (with the new committed value re-anchoring
 * the thumb) lands at the right pixel without any leftover MT delta.
 */
function _resetActiveThumbTransform() {
  'main thread'
  const idx = activeIndexRef.current
  if (idx < 0) return
  const els = thumbElsRef.current
  if (idx >= els.length) return
  const el = els[idx] as { setStyleProperty?: (k: string, v: string) => void } | null
  if (!el?.setStyleProperty) return
  const edge = startEdgeRef.current
  if (axisRef.current === 0) {
    el.setStyleProperty('transform', 'translateX(-50%)')
  }
  else {
    el.setStyleProperty('transform', edge === 3 ? 'translateY(50%)' : 'translateY(-50%)')
  }
}

function _onTouchStart(e: { touches: Array<{ pageX: number, pageY: number }> }) {
  'main thread'
  if (root.disabledMT.current) return
  // Unmeasured track — bail instead of starting a gesture. `_valueFromTouch`
  // would map every coordinate to `min`, silently clobbering the consumer's
  // value with 0 and then refusing to move.
  if ((axisRef.current === 0 ? rectWRef.current : rectHRef.current) <= 0) return
  // Thumb/range elements are resolved lazily: the first touch is guaranteed to
  // land after the subtree is painted, whereas mount time is not.
  if (thumbElsRef.current.length === 0) _resolveEls()
  if (thumbElsRef.current.length === 0) return
  const t = e.touches[0]
  const value = _valueFromTouch(t.pageX, t.pageY)
  const idx = _pickClosestIndex(value)
  activeIndexRef.current = idx
  // Snapshot all start values so multi-thumb paint can compute per-thumb
  // deltas from a stable anchor. `.slice()` because the array is shared with
  // BG via `valuesMT` and could be replaced under our feet.
  const snapshot: number[] = []
  const src = root.valuesMT.current
  for (let i = 0; i < src.length; i++) snapshot.push(src[i])
  startValuesRef.current = snapshot
  // Optimistically update the MT-side value array so a follow-up paint reads
  // the new value if BG hasn't yet committed.
  const next: number[] = []
  for (let i = 0; i < src.length; i++) next.push(i === idx ? value : src[i])
  root.valuesMT.current = next
  _paintActiveThumb(value)
  _paintRange(next)
}

function _onTouchMove(e: { touches: Array<{ pageX: number, pageY: number }> }) {
  'main thread'
  if (activeIndexRef.current === -1) return
  const t = e.touches[0]
  const value = _valueFromTouch(t.pageX, t.pageY)
  const idx = activeIndexRef.current
  const src = root.valuesMT.current
  const next: number[] = []
  for (let i = 0; i < src.length; i++) next.push(i === idx ? value : src[i])
  root.valuesMT.current = next
  _paintActiveThumb(value)
  _paintRange(next)
}

function _onTouchEnd() {
  'main thread'
  if (activeIndexRef.current === -1) return
  // Sort to match the BG path's `getNextSortedValues` invariant — multi-thumb
  // sliders keep values monotonically increasing so range fill renders right.
  const src = root.valuesMT.current
  const finalVals: number[] = []
  for (let i = 0; i < src.length; i++) finalVals.push(src[i])
  finalVals.sort((a, b) => a - b)
  _resetActiveThumbTransform()
  activeIndexRef.current = -1
  runOnBackground(_commit as any)(finalVals)
}

// BG callback — invoked from the touchend worklet with the final snapped
// values. Cannot be aliased; see the worklet-transform notes in Draggable.
function _commit(values: number[]) {
  root.commitFromMT(values)
}

// Initial rect comes from the BG `@layoutchange` below, which fires once after
// mount — before any touch can reach a painted element.
</script>

<template>
  <Primitive
    data-vyui-slider-impl
    v-bind="props"
    :main-thread-ref="mtBound ? trackRef : undefined"
    :main-thread-bindtouchstart="mtBound ? _onTouchStart : undefined"
    :main-thread-bindtouchmove="mtBound ? _onTouchMove : undefined"
    :main-thread-bindtouchend="mtBound ? _onTouchEnd : undefined"
    :main-thread-bindtouchcancel="mtBound ? _onTouchEnd : undefined"
    @layoutchange="onLayoutChange"
  >
    <slot />
  </Primitive>
</template>
