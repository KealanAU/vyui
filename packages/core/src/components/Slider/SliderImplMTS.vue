<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Main-thread touch + thumb-paint path for Slider, used in place of
     SliderImpl when `mainThreadDrag` is on. The drag runs entirely on the
     main thread: rect measurement is cached in MT refs (refreshed on
     `layoutchange`), each `touchmove` worklet computes the next value, snaps
     to `step`, and paints the active thumb's transform directly via
     `setStyleProperty`. BG only sees one round-trip per gesture — on
     `touchend` — which the root commits as a `valueCommit`. -->
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
import { runOnBackground, useMainThreadRef } from 'vue-lynx'

import { Primitive } from '@/components/Primitive'
import { injectSliderRootContext } from './SliderRoot.vue'
import { injectSliderOrientationContext } from './utils'

const props = withDefaults(defineProps<SliderImplMTSProps>(), {
  as: 'view',
})

const root = injectSliderRootContext()
const orientation = injectSliderOrientationContext()

// --- Track MT refs ----------------------------------------------------------
const trackRef = useMainThreadRef<any>(null)

// Track rect, refreshed on `layoutchange` and on first `touchstart`. Stored as
// individual scalar refs because `useMainThreadRef<object>` is less reliable
// across the worklet boundary than primitives — see comment in Sheet.
const rectXRef = useMainThreadRef<number>(0)
const rectYRef = useMainThreadRef<number>(0)
const rectWRef = useMainThreadRef<number>(0)
const rectHRef = useMainThreadRef<number>(0)

// --- Orientation MT mirrors -------------------------------------------------
// 0 = horizontal (read clientX, paint translateX), 1 = vertical.
const axisRef = useMainThreadRef<0 | 1>(orientation.size === 'width' ? 0 : 1)
const startEdgeRef = useMainThreadRef<StartEdgeCode>(encodeStartEdge(orientation.startEdge.value))

watch(() => orientation.startEdge.value, (v) => {
  startEdgeRef.current = encodeStartEdge(v)
})

// --- Drag state -------------------------------------------------------------
const activeIndexRef = useMainThreadRef<number>(-1)
// Snapshot of all thumb values at touchstart — used to compute each thumb's
// stable BG-anchor position so paint deltas are relative to it.
const startValuesRef = useMainThreadRef<number[]>([])

// ---------------------------------------------------------------------------
// Worklets
// ---------------------------------------------------------------------------

function _measureRect() {
  'main thread'
  const el = trackRef as unknown as {
    current?: { getBoundingClientRect?: () => { x: number, y: number, width: number, height: number } }
  }
  const r = el.current?.getBoundingClientRect?.()
  if (r) {
    rectXRef.current = r.x
    rectYRef.current = r.y
    rectWRef.current = r.width
    rectHRef.current = r.height
  }
}

function _onLayoutChange() {
  'main thread'
  _measureRect()
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
  const handles = root.thumbHandlesMT.current
  if (!handles || idx >= handles.length) return
  const h = handles[idx]
  const el = h?.elementRef?.current as { setStyleProperty?: (k: string, v: string) => void } | null
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
 * Reset the active thumb's transform to its BG-side centering. Called on
 * touchend so the next BG render (with the new committed value re-anchoring
 * the thumb) lands at the right pixel without any leftover MT delta.
 */
function _resetActiveThumbTransform() {
  'main thread'
  const idx = activeIndexRef.current
  if (idx < 0) return
  const handles = root.thumbHandlesMT.current
  if (!handles || idx >= handles.length) return
  const h = handles[idx]
  const el = h?.elementRef?.current as { setStyleProperty?: (k: string, v: string) => void } | null
  if (!el?.setStyleProperty) return
  const edge = startEdgeRef.current
  if (axisRef.current === 0) {
    el.setStyleProperty('transform', 'translateX(-50%)')
  }
  else {
    el.setStyleProperty('transform', edge === 3 ? 'translateY(50%)' : 'translateY(-50%)')
  }
}

function _onTouchStart(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  if (root.disabledMT.current) return
  // Re-measure here in case `layoutchange` hasn't fired yet (first interaction
  // after mount on some Lynx builds).
  if (rectWRef.current === 0 && rectHRef.current === 0) _measureRect()
  const t = e.touches[0]
  const value = _valueFromTouch(t.clientX, t.clientY)
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
}

function _onTouchMove(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  if (activeIndexRef.current === -1) return
  const t = e.touches[0]
  const value = _valueFromTouch(t.clientX, t.clientY)
  const idx = activeIndexRef.current
  const src = root.valuesMT.current
  const next: number[] = []
  for (let i = 0; i < src.length; i++) next.push(i === idx ? value : src[i])
  root.valuesMT.current = next
  _paintActiveThumb(value)
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

// Initial rect comes from `:main-thread-bindlayoutchange` which fires once
// after mount on the MT side. `_onTouchStart` re-measures defensively if the
// layout event hasn't landed yet.
</script>

<template>
  <Primitive
    data-slider-impl
    v-bind="props"
    :main-thread-ref="trackRef"
    :main-thread-bindtouchstart="_onTouchStart"
    :main-thread-bindtouchmove="_onTouchMove"
    :main-thread-bindtouchend="_onTouchEnd"
    :main-thread-bindtouchcancel="_onTouchEnd"
    :main-thread-bindlayoutchange="_onLayoutChange"
  >
    <slot />
  </Primitive>
</template>
