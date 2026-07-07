<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Each item runs its own MT touch pipeline. On long-press
     the row lifts, follows the finger via `setStyleProperty('transform')`,
     and shifts non-lifted siblings on the same thread by iterating the
     SortableRoot registry. BG only sees: dragStart, dragEnd, commitReorder. -->
<script lang="ts">
export interface SortableItemProps {
  /** Logical index of this item in the SortableRoot's `items` array. */
  index: number
  /** Disable dragging on this specific row. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

import type { SortableItemHandle } from './sortableContext'
import { injectSortableRootContext } from './sortableContext'

const props = withDefaults(defineProps<SortableItemProps>(), {
  disabled: false,
})

defineSlots<{
  default?: (props: { dragging: boolean, index: number }) => any
}>()

const ctx = injectSortableRootContext()

// BG-side dragging state — drives the `ui-dragging` class so themes can
// restyle the lifted row (e.g. hide its divider, which is painted on this
// element and would otherwise travel with the drag transform).
const isDragging = computed(() => ctx.draggingIndex.value === props.index)

const containerRef = useMainThreadRef<any>(null)
const touchStartYRef = useMainThreadRef<number>(0)
const touchStartTimeRef = useMainThreadRef<number>(0)
const armedRef = useMainThreadRef<boolean>(false) // touchstart fired, awaiting activation
const draggingRef = useMainThreadRef<boolean>(false) // long-press confirmed
const indexRef = useMainThreadRef<number>(props.index)
const itemDisabledRef = useMainThreadRef<boolean>(props.disabled)
const lastTargetRef = useMainThreadRef<number>(-1)
const liftedDyRef = useMainThreadRef<number>(0)
// Long-press activation is timed on the main thread by polling
// `requestAnimationFrame`, NOT `setTimeout`. The MT worklet runtime does not
// expose `setTimeout`/`clearTimeout` — they're commented out as internal in
// @lynx-js/types (main-thread/lynx.d.ts) — so the old timer threw inside the
// worklet and the row never lifted (iOS + web). The rAF poller (`_activationTick`)
// checks elapsed time against `longPressMs` each frame and is cancelled
// implicitly when `armedRef` clears (move-disarm / touchend / unmount).

// Velocity tracker (Y) — drives the velocity-aware drop: a fast toss lands one
// row further in the flick direction than the raw pointer offset (mirrors
// physics.ts sortableDropTarget).
const posQueueRef = useMainThreadRef<number[]>([])
const timeQueueRef = useMainThreadRef<number[]>([])

// Index / disabled live on the MT and gate the touch worklets. BG writes to a
// MainThreadRef.current are no-ops in vue-lynx 0.4.0, so push updates through a
// setter worklet rather than assigning `.current` from this (BG) thread.
watch(() => props.index, (v) => { runOnMainThread(_syncIndexMT as any)(v) })
watch(() => props.disabled, (v) => { runOnMainThread(_syncDisabledMT as any)(v) })

// The handle (element + logical index) MUST be appended ON the main thread:
// `ctx.itemHandlesMT` is a MainThreadRef and BG writes to it are dropped by
// vue-lynx 0.4.0. The previous `onMounted` registration ran on the BG thread,
// so the registry stayed empty — the lifted row never moved, siblings never
// shifted, and the drop saw `count === 0`, so no reorder ever committed.
// Registration now happens in `_registerMT` (bound to `main-thread-binduiappear`,
// where this item's MT element ref is populated) and teardown in `_unregisterMT`.
const handleRef = useMainThreadRef<SortableItemHandle | null>(null)

onBeforeUnmount(() => {
  // All teardown runs on the MT (BG `.current` writes are dropped): cancel any
  // pending long-press and drop this item from the registry.
  runOnMainThread(_cancelActivation as any)()
  runOnMainThread(_unregisterMT as any)()
})

/**
 * Append this item to the MT registry. Bound to `main-thread-binduiappear` so
 * the element ref is guaranteed populated. Guarded against the repeat appears
 * Lynx fires when a row scrolls back into view.
 */
function _registerMT() {
  'main thread'
  if (handleRef.current) return
  const el = (containerRef as unknown as { current: any }).current
  const handle: SortableItemHandle = { index: indexRef.current, elementRef: { current: el } }
  handleRef.current = handle
  ctx.itemHandlesMT.current = [...ctx.itemHandlesMT.current, handle]
}

/** Remove this item from the MT registry on unmount. */
function _unregisterMT() {
  'main thread'
  const h = handleRef.current
  if (!h) return
  ctx.itemHandlesMT.current = ctx.itemHandlesMT.current.filter(x => x !== h)
  handleRef.current = null
}

/** Push a new logical index to the MT (ref + registry handle). */
function _syncIndexMT(v: number) {
  'main thread'
  indexRef.current = v
  if (handleRef.current) handleRef.current.index = v
}

/** Push the per-row disabled flag to the MT. */
function _syncDisabledMT(v: boolean) {
  'main thread'
  itemDisabledRef.current = v
}

function _setTransform(
  el: { setStyleProperty?(k: string, v: string): void } | null,
  y: number,
) {
  'main thread'
  if (el && el.setStyleProperty) {
    el.setStyleProperty('transform', `translateY(${y}px)`)
  }
}

/** Paint every non-lifted handle's transform for the given target index. */
function _shiftOthers(startIdx: number, targetIdx: number) {
  'main thread'
  const itemH = ctx.itemHeightMT.current
  const handles = ctx.itemHandlesMT.current
  for (let i = 0; i < handles.length; i++) {
    const h = handles[i]
    if (h.index === startIdx) continue
    let offset = 0
    if (startIdx < targetIdx && h.index > startIdx && h.index <= targetIdx) {
      offset = -itemH
    }
    else if (startIdx > targetIdx && h.index >= targetIdx && h.index < startIdx) {
      offset = itemH
    }
    _setTransform(h.elementRef.current, offset)
  }
}

/** Clear every handle's transform. Called on cancel and after commit. */
function _clearAll() {
  'main thread'
  const handles = ctx.itemHandlesMT.current
  for (let i = 0; i < handles.length; i++) {
    _setTransform(handles[i].elementRef.current, 0)
  }
}

/**
 * Nudge the scroll container when the finger nears an edge during a drag.
 * `pageY` is the absolute pointer Y; the viewport top/height come from the
 * root context (measured on mount). Speed ramps linearly inside the edge
 * band — mirrors physics.ts autoscrollDelta. Reads/writes `scrollTop`
 * directly (MT-local), falling back to `scrollTo` when present.
 */
function _autoScroll(pageY: number) {
  'main thread'
  const edge = ctx.autoScrollEdgeMT.current
  if (edge <= 0) return
  const el = ctx.scrollRefMT.current as unknown as {
    scrollTop?: number
    scrollHeight?: number
    clientHeight?: number
    scrollTo?(opts: { top?: number, behavior?: string }): void
  } | null
  if (!el) return
  const viewportTop = ctx.viewportTopMT.current
  const viewport = ctx.viewportHeightMT.current
  if (viewport <= 0) return
  const pointer = pageY - viewportTop
  const maxSpeed = ctx.autoScrollSpeedMT.current

  let delta = 0
  if (pointer < edge) {
    const intensity = (edge - pointer) / edge
    delta = -maxSpeed * (intensity > 1 ? 1 : intensity < 0 ? 0 : intensity)
  }
  else {
    const bottom = viewport - edge
    if (pointer > bottom) {
      const intensity = (pointer - bottom) / edge
      delta = maxSpeed * (intensity > 1 ? 1 : intensity < 0 ? 0 : intensity)
    }
  }
  if (delta === 0) return

  const cur = typeof el.scrollTop === 'number' ? el.scrollTop : 0
  let next = cur + delta
  if (next < 0) next = 0
  const maxScroll = (el.scrollHeight ?? 0) - (el.clientHeight ?? viewport)
  if (maxScroll >= 0 && next > maxScroll) next = maxScroll
  if (typeof el.scrollTo === 'function') {
    el.scrollTo({ top: next, behavior: 'auto' })
  }
  else if (typeof el.scrollTop === 'number') {
    el.scrollTop = next
  }
}

/**
 * Called by BG after the long-press timer elapses. Marks this item as the
 * lifted one provided the finger is still down and no other item has claimed
 * the gesture in the meantime.
 */
function _activate() {
  'main thread'
  if (!armedRef.current) return
  if (ctx.draggingIndexMT.current !== -1) return
  if (ctx.disabledMT.current || itemDisabledRef.current) return
  draggingRef.current = true
  ctx.draggingIndexMT.current = indexRef.current
  lastTargetRef.current = indexRef.current
  // Paint a small lift so the user sees the row engage even before they move.
  _setTransform((containerRef as unknown as { current: any }).current, 0)
  runOnBackground(_emitDragStart as any)(indexRef.current)
}

/**
 * Main-thread long-press poller. Scheduled via `requestAnimationFrame` from
 * touchstart; lifts the row once the press outlives `longPressMs`. Bails (and
 * stops rescheduling) as soon as the gesture disarms, the row is already
 * dragging, or another item has claimed the gesture. Uses rAF because the MT
 * worklet runtime has no `setTimeout`.
 */
function _activationTick() {
  'main thread'
  if (!armedRef.current || draggingRef.current) return
  if (ctx.draggingIndexMT.current !== -1) return
  if (Date.now() - touchStartTimeRef.current >= ctx.longPressMsMT.current) {
    _activate()
    return
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_activationTick)
  else (lynx as any).requestAnimationFrame(_activationTick)
}

function _onTouchStart(e: { touches: Array<{ clientY: number }> }) {
  'main thread'
  if (ctx.disabledMT.current || itemDisabledRef.current) return
  if (ctx.draggingIndexMT.current !== -1) return
  armedRef.current = true
  draggingRef.current = false
  touchStartYRef.current = e.touches[0].clientY
  touchStartTimeRef.current = Date.now()
  liftedDyRef.current = 0
  lastTargetRef.current = indexRef.current
  posQueueRef.current = [e.touches[0].clientY]
  timeQueueRef.current = [Date.now()]
  // Defer activation by `longPressMs` so a tap or vertical scroll doesn't lift.
  // Timed entirely on the main thread via an rAF poller — `_onTouchMove` disarms
  // it if the finger travels before it fires, and `_onTouchEnd` clears it on
  // release. rAF (not setTimeout) because the MT worklet runtime lacks timers.
  const delay = ctx.longPressMsMT.current
  if (delay <= 0) {
    _activate()
  }
  else if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(_activationTick)
  }
  else {
    (lynx as any).requestAnimationFrame(_activationTick)
  }
}

function _onTouchMove(e: { touches: Array<{ clientY: number }> }) {
  'main thread'
  if (!armedRef.current) return
  const y = e.touches[0].clientY
  const dy = y - touchStartYRef.current

  // Pre-activation: a meaningful pre-timer move means the user was scrolling.
  // Disarm + cancel the pending long-press so the row never lifts mid-scroll.
  if (!draggingRef.current) {
    if (Math.abs(dy) > 6) {
      // Disarm: the rAF activation poller bails on its next frame once armed clears.
      armedRef.current = false
    }
    return
  }

  const startIdx = indexRef.current
  const itemH = ctx.itemHeightMT.current
  const count = ctx.itemHandlesMT.current.length

  liftedDyRef.current = dy
  _setTransform((containerRef as unknown as { current: any }).current, dy)

  // Velocity sampling — last 50ms window, keep >=2 so a release always has a
  // pair to differentiate.
  posQueueRef.current.push(y)
  timeQueueRef.current.push(Date.now())
  const tq = timeQueueRef.current
  const pq = posQueueRef.current
  const cutoff = Date.now() - 50
  while (tq.length > 2 && tq[0] < cutoff) {
    tq.shift()
    pq.shift()
  }

  let target = startIdx + Math.round(dy / itemH)
  if (target < 0) target = 0
  if (target > count - 1) target = count - 1
  lastTargetRef.current = target

  _shiftOthers(startIdx, target)

  // Edge autoscroll — when the finger nears the top/bottom of the scroll
  // viewport, nudge the container so long lists keep reordering past the fold.
  // Mirrors physics.ts autoscrollDelta. No-op when the root isn't a scroller
  // (scrollTop/scrollTo absent) or no viewport height was measured.
  _autoScroll(y)
}

function _onTouchEnd() {
  'main thread'
  if (!armedRef.current && !draggingRef.current) return
  armedRef.current = false

  // A still-pending long-press is cancelled implicitly: `armedRef` is now false,
  // so the rAF activation poller bails on its next frame — a quick tap/release
  // never lifts the row after the finger is already gone.

  if (!draggingRef.current) {
    // Long-press never confirmed — nothing to do.
    return
  }

  draggingRef.current = false
  const startIdx = indexRef.current
  let target = lastTargetRef.current
  if (target < 0) target = startIdx

  // Velocity-aware drop — a fast toss lands one row further in the flick
  // direction than the pointer offset settled on. Mirrors physics.ts
  // sortableDropTarget. Inline velocity (px/s) from the Y queues.
  const tq = timeQueueRef.current
  const pq = posQueueRef.current
  let velocity = 0
  if (tq.length >= 2) {
    const dt = (tq[tq.length - 1] - tq[0]) / 1000
    if (dt > 0) velocity = (pq[pq.length - 1] - pq[0]) / dt
  }
  const count = ctx.itemHandlesMT.current.length
  // VELOCITY_THRESHOLD_DEFAULT = 300 (physics.ts).
  if (velocity < 0 ? -velocity >= 300 : velocity >= 300) {
    const dir = velocity > 0 ? 1 : -1
    if (dir > 0 && target >= startIdx) target += 1
    else if (dir < 0 && target <= startIdx) target -= 1
  }
  if (target < 0) target = 0
  if (target > count - 1) target = count - 1

  _clearAll()
  liftedDyRef.current = 0
  posQueueRef.current = []
  timeQueueRef.current = []
  ctx.draggingIndexMT.current = -1
  runOnBackground(_emitDragEnd as any)(startIdx, target)
}

function _emitDragStart(idx: number) {
  ctx.notifyDragStart(idx)
}

function _emitDragEnd(from: number, to: number) {
  ctx.commitReorder(from, to)
  ctx.notifyDragEnd()
}

// MT teardown — disarm a pending long-press when the row unmounts. BG writes to
// `.current` are dropped, so this must happen ON the MT. The rAF poller reads
// `armedRef` each frame and stops once it's false.
function _cancelActivation() {
  'main thread'
  armedRef.current = false
}
</script>

<template>
  <view
    class="vyui-sortable__item"
    :class="{ 'ui-dragging': isDragging }"
    data-vyui-sortable-item
    :data-state="isDragging ? 'dragging' : 'idle'"
    :main-thread-ref="containerRef"
    :main-thread-binduiappear="_registerMT"
    :main-thread-bindtouchstart="_onTouchStart"
    :main-thread-bindtouchmove="_onTouchMove"
    :main-thread-bindtouchend="_onTouchEnd"
    :main-thread-bindtouchcancel="_onTouchEnd"
    :style="{
      height: `${ctx.itemHeight.value}px`,
      flexShrink: 0,
    }"
  >
    <slot :dragging="isDragging" :index="props.index" />
  </view>
</template>
