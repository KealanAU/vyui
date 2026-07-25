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

// Track SIZE only, refreshed on `layoutchange`. Stored as individual scalar
// refs because `useMainThreadRef<object>` is less reliable across the worklet
// boundary than primitives — see comment in Sheet.
//
// Deliberately not its position. `layoutchange` reports top/left relative to
// the PAGE; a touch reports pageX/pageY relative to the VIEWPORT. Inside a
// scroll-view the two drift apart by the scroll offset, so an offset rebuilt as
// `pageY - top` is only correct while nothing has scrolled — measured on device
// at top 2805 against pageY 448. `touches[0].x`/`.y` are already measured from
// the bound element's origin, so the mapping needs no origin of its own and
// nothing to re-sync on scroll.
const rectWRef = useMainThreadRef<number>(0)
const rectHRef = useMainThreadRef<number>(0)

// 0 = horizontal (read the touch x offset, paint the left/right anchor), 1 = vertical.
const axisRef = useMainThreadRef<0 | 1>(orientation.size === 'width' ? 0 : 1)
const startEdgeRef = useMainThreadRef<StartEdgeCode>(encodeStartEdge(orientation.startEdge.value))

watch(() => orientation.startEdge.value, (v) => {
  startEdgeRef.current = encodeStartEdge(v)
})

const activeIndexRef = useMainThreadRef<number>(-1)
// True for the length of a gesture. The main thread owns the values while it is
// set, so the background's own `valuesMT` push is ignored — otherwise a live
// `update:modelValue` echoes straight back and can stomp a newer MT value.
const draggingRef = useMainThreadRef<boolean>(false)

// Lynx's main-thread `Element` has no `getBoundingClientRect` (see
// `@lynx-js/types` main-thread/element.d.ts — the MT surface is
// get/setAttribute, setStyleProperty, querySelector, invoke, animate), so the
// track has to be measured on the BG and pushed across. Same shape Sheet uses
// for its panel extent: BG `@layoutchange` -> `runOnMainThread` setter, since
// plain BG writes to `MainThreadRef.current` are silently dropped. The
// dispatch is post-mount, so it can't hit the setup-time MT-ref registration
// race.
//
function _setSize(w: number, h: number) {
  'main thread'
  rectWRef.current = w
  rectHRef.current = h
}

const { onLayoutChange } = useResizeObserver((r) => {
  void runOnMainThread(_setSize as any)(r.width, r.height)
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

/**
 * Convert an ELEMENT-RELATIVE touch offset into a logical value, snapped and
 * clamped. `touches[0].x`/`.y` are already measured from the bound element's
 * own origin, which is why no rect position is involved.
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

/**
 * Move thumb `idx` to `value` and re-sort. Mirrors the old background
 * `updateValues`: thumbs are allowed to cross, and the array is kept
 * monotonically increasing so the range fill and `valueCommit` stay coherent.
 */
function _applyValue(values: number[], idx: number, value: number): number[] {
  'main thread'
  const next: number[] = []
  for (let i = 0; i < values.length; i++) next.push(i === idx ? value : values[i])
  next.sort((a, b) => a - b)
  return next
}

/**
 * `minStepsBetweenThumbs`, enforced per frame rather than at commit time. A
 * violating frame is simply dropped so the thumb stops dead at the limit —
 * checking it only on `touchend` would let the drag paint past the limit and
 * then snap back on release.
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
 * This writes the SAME anchor property the background style computes
 * (`[startEdge]: <pct>%`), rather than translating by a delta from a frozen
 * anchor. That matters now the background is updated live during the drag: a
 * delta-from-touchstart paint double-counts as soon as the background re-anchors
 * mid-gesture, whereas writing the absolute position means both threads converge
 * on the same declaration and the last writer simply wins. It also removes the
 * need to unwind anything on touchend — the centring `transform` is left alone.
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

  // The range's end edge is always the opposite side of its start edge.
  const edge = startEdgeRef.current
  const startName = _edgeName(edge)
  const endName = _edgeName(edge === 0 ? 1 : edge === 1 ? 0 : edge === 2 ? 3 : 2)
  el.setStyleProperty(startName, `${lo}%`)
  el.setStyleProperty(endName, `${100 - hi}%`)
}

function _onTouchStart(e: { touches: Array<{ x: number, y: number }> }) {
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
  const value = _valueFromTouch(t.x, t.y)
  const idx = _pickClosestIndex(value)
  activeIndexRef.current = idx
  draggingRef.current = true
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

function _onTouchMove(e: { touches: Array<{ x: number, y: number }> }) {
  'main thread'
  if (activeIndexRef.current === -1) return
  const t = e.touches[0]
  const value = _valueFromTouch(t.x, t.y)
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

function _onTouchEnd() {
  'main thread'
  if (activeIndexRef.current === -1) return
  // Already sorted and gap-checked by `_applyValue` on every frame, so this is
  // exactly what the commit will write — and therefore what the fill should be
  // left painted at.
  const src = root.valuesMT.current
  const finalVals: number[] = []
  for (let i = 0; i < src.length; i++) finalVals.push(src[i])
  _paintRange(finalVals)
  activeIndexRef.current = -1
  draggingRef.current = false
  runOnBackground(_commit as any)(finalVals)
}

// BG callbacks — invoked from the touch worklets. Cannot be aliased; see the
// worklet-transform notes in Draggable.

/**
 * Per-frame `update:modelValue`. The paint stays on the main thread, so this
 * costs one background hop per touchmove and nothing else waits on it — but a
 * consumer rendering the number next to the slider needs it, and freezing that
 * readout until release looks broken.
 */
function _emitLive(values: number[]) {
  root.updateFromMT(values)
}

/** Final value of the gesture — the one that also emits `valueCommit`. */
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
