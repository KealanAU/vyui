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
import { computed, nextTick, onBeforeUnmount, watch } from 'vue'
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
// restyle the lifted row.
const isDragging = computed(() => ctx.draggingIndex.value === props.index)

/**
 * Row style. The lifted row is raised in the paint order on WEB ONLY.
 *
 * Lynx web re-targets pointer events by position, so a row dragged downward
 * slides under the rows it passes and the gesture strands mid-drag; a `zIndex`
 * fixes it there. Lynx native must not get it: z-indexing promotes the view out
 * of its layout position and the row jumps to a screen-absolute Y.
 *
 * Read at render, not setup — `SystemInfo` can resolve late.
 */
const rowStyle = computed(() => {
  const style: Record<string, unknown> = {
    height: `${ctx.itemHeight.value}px`,
    flexShrink: 0,
  }
  if ((globalThis.SystemInfo?.platform as string) === 'web')
    style.zIndex = isDragging.value ? 1 : 0
  return style
})

const containerRef = useMainThreadRef<any>(null)
const touchStartYRef = useMainThreadRef<number>(0)
const touchStartTimeRef = useMainThreadRef<number>(0)
const armedRef = useMainThreadRef<boolean>(false) // touchstart fired, awaiting activation
const draggingRef = useMainThreadRef<boolean>(false) // long-press confirmed
const indexRef = useMainThreadRef<number>(props.index)
const itemDisabledRef = useMainThreadRef<boolean>(props.disabled)
const lastTargetRef = useMainThreadRef<number>(-1)
const liftedDyRef = useMainThreadRef<number>(0)
// Timestamp of the last real touch: touch browsers replay a tap as a
// compatibility mousedown/mouseup pair, which mouse handlers ignore.
const lastTouchTsRef = useMainThreadRef<number>(0)
// Long-press activation is timed on the main thread by polling
// `requestAnimationFrame`, NOT `setTimeout`: the MT worklet runtime does not
// expose timers, so the old `setTimeout` threw inside the worklet and the row
// never lifted. `_activationTick` is cancelled implicitly when `armedRef`
// clears (move-disarm / touchend / unmount).

// Velocity tracker (Y) for the velocity-aware drop — mirrors physics.ts
// sortableDropTarget.
const posQueueRef = useMainThreadRef<number[]>([])
const timeQueueRef = useMainThreadRef<number[]>([])

// Index / disabled live on the MT and gate the touch worklets. BG writes to a
// MainThreadRef.current are no-ops, so updates go through a setter worklet.
watch(() => props.index, (v) => { runOnMainThread(_syncIndexMT as any)(v) })
watch(() => props.disabled, (v) => { runOnMainThread(_syncDisabledMT as any)(v) })

// The handle (element + logical index) MUST be appended ON the main thread:
// `ctx.itemHandlesMT` is a MainThreadRef and BG writes to it are dropped.
// Registration happens in `_registerMT` (bound to `main-thread-binduiappear`,
// where this item's MT element ref is populated), teardown in `_unregisterMT`.
const handleRef = useMainThreadRef<SortableItemHandle | null>(null)

onBeforeUnmount(() => {
  // All teardown runs on the MT (BG `.current` writes are dropped).
  runOnMainThread(_cancelActivation as any)()
  runOnMainThread(_unregisterMT as any)()
})

/**
 * Append this item to the MT registry. Bound to `main-thread-binduiappear` so
 * the element ref is populated, and guarded against the repeat appears Lynx
 * fires when a row scrolls back into view.
 */
function _registerMT() {
  'main thread'
  if (handleRef.current) return
  const el = (containerRef as unknown as { current: any }).current
  const handle: SortableItemHandle = { index: indexRef.current, elementRef: { current: el } }
  handleRef.current = handle
  ctx.itemHandlesMT.current = [...ctx.itemHandlesMT.current, handle]
}

function _unregisterMT() {
  'main thread'
  const h = handleRef.current
  if (!h) return
  ctx.itemHandlesMT.current = ctx.itemHandlesMT.current.filter(x => x !== h)
  handleRef.current = null
}

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

/**
 * Clear every handle's transform. Called from the background once a commit has
 * rendered — never on the main thread at release, which would repaint the
 * pre-drag order until the reorder lands.
 */
function _clearAll() {
  'main thread'
  const handles = ctx.itemHandlesMT.current
  for (let i = 0; i < handles.length; i++) {
    _setTransform(handles[i].elementRef.current, 0)
  }
}

/**
 * Nudge the scroll container when the finger nears an edge during a drag.
 * Speed ramps linearly inside the edge band — mirrors physics.ts
 * autoscrollDelta. Reads/writes `scrollTop` directly (MT-local), falling back
 * to `scrollTo` when present.
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
 * Called by BG after the long-press timer elapses. Lifts this item provided the
 * finger is still down and no other item has claimed the gesture.
 */
function _activate() {
  'main thread'
  if (!armedRef.current) return
  if (ctx.draggingIndexMT.current !== -1) return
  if (ctx.disabledMT.current || itemDisabledRef.current) return
  draggingRef.current = true
  ctx.draggingIndexMT.current = indexRef.current
  lastTargetRef.current = indexRef.current
  _setTransform((containerRef as unknown as { current: any }).current, 0)
  runOnBackground(_emitDragStart as any)(indexRef.current)
}

/**
 * Main-thread long-press poller, scheduled via `requestAnimationFrame` from
 * touchstart. Bails (and stops rescheduling) once the gesture disarms, the row
 * is already dragging, or another item claimed the gesture. rAF because the MT
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

function _gestureStart(clientY: number) {
  'main thread'
  if (ctx.disabledMT.current || itemDisabledRef.current) return
  if (ctx.draggingIndexMT.current !== -1) return
  armedRef.current = true
  draggingRef.current = false
  touchStartYRef.current = clientY
  touchStartTimeRef.current = Date.now()
  liftedDyRef.current = 0
  lastTargetRef.current = indexRef.current
  posQueueRef.current = [clientY]
  timeQueueRef.current = [Date.now()]
  // Defer activation by `longPressMs` so a tap or vertical scroll doesn't lift.
  // Timed on the main thread via an rAF poller — the MT runtime lacks timers.
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

function _gestureMove(clientY: number) {
  'main thread'
  if (!armedRef.current) return
  const y = clientY
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

  // Edge autoscroll — mirrors physics.ts autoscrollDelta. No-op when the root
  // isn't a scroller or no viewport height was measured.
  _autoScroll(y)
}

function _gestureEnd() {
  'main thread'
  if (!armedRef.current && !draggingRef.current) return
  armedRef.current = false

  // A still-pending long-press is cancelled implicitly: `armedRef` is now
  // false, so the rAF activation poller bails on its next frame.

  if (!draggingRef.current) {
    return
  }

  draggingRef.current = false
  const startIdx = indexRef.current
  let target = lastTargetRef.current
  if (target < 0) target = startIdx

  // Velocity-aware drop — a fast toss lands one row further in the flick
  // direction. Mirrors physics.ts sortableDropTarget.
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

  // Settle into the target slot rather than clearing here: clearing on release
  // repaints the ORIGINAL order for however many frames the background commit
  // takes, so the list visibly snaps back and then reorders. `_emitDragEnd`
  // clears the transforms once that commit has rendered.
  _shiftOthers(startIdx, target)
  _setTransform(
    (containerRef as unknown as { current: any }).current,
    (target - startIdx) * ctx.itemHeightMT.current,
  )
  liftedDyRef.current = 0
  posQueueRef.current = []
  timeQueueRef.current = []
  ctx.draggingIndexMT.current = -1
  runOnBackground(_emitDragEnd as any)(startIdx, target)
}

function _onTouchStart(e: { touches: Array<{ clientY: number }> }) {
  'main thread'
  _gestureStart(e.touches[0].clientY)
}

function _onTouchMove(e: { touches: Array<{ clientY: number }> }) {
  'main thread'
  _gestureMove(e.touches[0].clientY)
}

function _onTouchEnd() {
  'main thread'
  lastTouchTsRef.current = Date.now()
  _gestureEnd()
}

// Desktop web: Lynx web dispatches raw mouse events and never synthesizes
// touch from them. Coordinates arrive top-level (mouse `detail` is the
// click-count number). No mouseleave binding — it doesn't bubble, so
// per-element delivery is unreliable on the Lynx dispatch path.
function _onMouseDown(e: { clientY: number, buttons?: number }) {
  'main thread'
  // Swallow the compatibility mousedown a touch browser replays after a tap.
  if (Date.now() - lastTouchTsRef.current < 500) return
  // Primary button only: a right/middle press would arm a phantom gesture that
  // the next hover move then works against.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return
  _gestureStart(e.clientY)
}

function _onMouseMove(e: { clientY: number, buttons?: number }) {
  'main thread'
  // Only an EXPLICIT buttons value with the primary bit clear counts as
  // released (recovers the mouseup lost outside the <lynx-view>); a missing
  // `buttons` is treated as still-pressed.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) {
    _gestureEnd()
    return
  }
  _gestureMove(e.clientY)
}

function _onMouseUp() {
  'main thread'
  _gestureEnd()
}

function _emitDragStart(idx: number) {
  ctx.notifyDragStart(idx)
}

function _emitDragEnd(from: number, to: number) {
  ctx.commitReorder(from, to)
  // Drop the settle transforms only once the reordered rows have rendered —
  // clearing any earlier shows the pre-drag order in between.
  void nextTick(() => {
    void runOnMainThread(_clearAll as any)()
    ctx.notifyDragEnd()
  })
}

// MT teardown — disarm a pending long-press when the row unmounts. BG writes to
// `.current` are dropped, so this must happen ON the MT.
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
    :main-thread-bindmousedown="_onMouseDown"
    :main-thread-bindmousemove="_onMouseMove"
    :main-thread-bindmouseup="_onMouseUp"
    :style="rowStyle"
  >
    <slot :dragging="isDragging" :index="props.index" />
  </view>
</template>
