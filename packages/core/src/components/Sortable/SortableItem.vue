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
import { onBeforeUnmount, onMounted, watch } from 'vue'
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

// ── MT refs ────────────────────────────────────────────────────────────────
const containerRef = useMainThreadRef<any>(null)
const touchStartYRef = useMainThreadRef<number>(0)
const touchStartTimeRef = useMainThreadRef<number>(0)
const armedRef = useMainThreadRef<boolean>(false) // touchstart fired, awaiting activation
const draggingRef = useMainThreadRef<boolean>(false) // long-press confirmed
const indexRef = useMainThreadRef<number>(props.index)
const itemDisabledRef = useMainThreadRef<boolean>(props.disabled)
const lastTargetRef = useMainThreadRef<number>(-1)
const liftedDyRef = useMainThreadRef<number>(0)
// Long-press timer id, MT-local. The activation delay is timed on the main
// thread (via the worklet `setTimeout`) so a touch never has to round-trip
// MT→BG→setTimeout→MT before the row can lift — that cross-channel hop is the
// documented-fragile path (see useDragGesture onMounted) and on-device it was
// dropping the activation entirely, so drag never started. 0 = no timer.
const activationTimerRef = useMainThreadRef<number>(0)

// Velocity tracker (Y) — drives the velocity-aware drop: a fast toss lands one
// row further in the flick direction than the raw pointer offset (mirrors
// physics.ts sortableDropTarget).
const posQueueRef = useMainThreadRef<number[]>([])
const timeQueueRef = useMainThreadRef<number[]>([])

watch(() => props.index, (v) => { indexRef.current = v })
watch(() => props.disabled, (v) => { itemDisabledRef.current = v })

// ── Registry handle (BG side; .current populated at mount) ─────────────────
const elementRef: SortableItemHandle['elementRef'] = { current: null }
let handle: SortableItemHandle | null = null
let unregister: (() => void) | null = null

onMounted(() => {
  elementRef.current = (containerRef as unknown as {
    current: { setStyleProperty?(k: string, v: string): void } | null
  }).current
  handle = { index: props.index, elementRef }
  unregister = ctx.register(handle)
})

watch(() => props.index, (v) => {
  if (handle) handle.index = v
})

onBeforeUnmount(() => {
  // Cancel a pending long-press on the MT (BG `.current` writes are dropped).
  runOnMainThread(_cancelActivation as any)()
  if (unregister) {
    unregister()
    unregister = null
  }
  handle = null
})

// ── Worklets ────────────────────────────────────────────────────────────────

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
  _setTransform(elementRef.current, 0)
  runOnBackground(_emitDragStart as any)(indexRef.current)
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
  // Timed entirely on the main thread — `_onTouchMove` disarms it if the finger
  // travels before it fires, and `_onTouchEnd` clears it on release. Keeping it
  // MT-local avoids the MT→BG→setTimeout→MT round-trip that was dropping the
  // activation on-device.
  if (activationTimerRef.current) {
    clearTimeout(activationTimerRef.current)
    activationTimerRef.current = 0
  }
  const delay = ctx.longPressMsMT.current
  if (delay <= 0) {
    _activate()
  }
  else {
    activationTimerRef.current = setTimeout(() => {
      activationTimerRef.current = 0
      _activate()
    }, delay) as unknown as number
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
      armedRef.current = false
      if (activationTimerRef.current) {
        clearTimeout(activationTimerRef.current)
        activationTimerRef.current = 0
      }
    }
    return
  }

  const startIdx = indexRef.current
  const itemH = ctx.itemHeightMT.current
  const count = ctx.itemHandlesMT.current.length

  liftedDyRef.current = dy
  _setTransform(elementRef.current, dy)

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

  // Cancel a still-pending long-press: a quick tap/release must not lift the
  // row after the finger is already gone.
  if (activationTimerRef.current) {
    clearTimeout(activationTimerRef.current)
    activationTimerRef.current = 0
  }

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

// ── BG callbacks ───────────────────────────────────────────────────────────

function _emitDragStart(idx: number) {
  ctx.notifyDragStart(idx)
}

function _emitDragEnd(from: number, to: number) {
  ctx.commitReorder(from, to)
  ctx.notifyDragEnd()
}

// MT teardown — cancel a pending long-press timer when the row unmounts. BG
// writes to `.current` are dropped, so the clear must happen ON the MT.
function _cancelActivation() {
  'main thread'
  if (activationTimerRef.current) {
    clearTimeout(activationTimerRef.current)
    activationTimerRef.current = 0
  }
}
</script>

<template>
  <view
    class="vyui-sortable__item"
    data-vyui-sortable-item
    :main-thread-ref="containerRef"
    :main-thread-bindtouchstart="_onTouchStart"
    :main-thread-bindtouchmove="_onTouchMove"
    :main-thread-bindtouchend="_onTouchEnd"
    :main-thread-bindtouchcancel="_onTouchEnd"
    :style="{
      height: `${ctx.itemHeight.value}px`,
      flexShrink: 0,
    }"
  >
    <slot :dragging="ctx.draggingIndex.value === props.index" :index="props.index" />
  </view>
</template>
