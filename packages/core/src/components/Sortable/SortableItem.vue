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

watch(() => props.index, (v) => { indexRef.current = v })
watch(() => props.disabled, (v) => { itemDisabledRef.current = v })

// ── Registry handle (BG side; .current populated at mount) ─────────────────
const elementRef: SortableItemHandle['elementRef'] = { current: null }
let handle: SortableItemHandle | null = null
let unregister: (() => void) | null = null
let pendingActivationTimer: ReturnType<typeof setTimeout> | null = null

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
  if (pendingActivationTimer != null) {
    clearTimeout(pendingActivationTimer)
    pendingActivationTimer = null
  }
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
  // Defer activation by `longPressMs` so a tap or vertical scroll doesn't lift.
  const delay = ctx.longPressMsMT.current
  if (delay <= 0) {
    _activate()
  }
  else {
    runOnBackground(_scheduleActivation as any)(indexRef.current, delay)
  }
}

function _onTouchMove(e: { touches: Array<{ clientY: number }> }) {
  'main thread'
  if (!armedRef.current) return
  const y = e.touches[0].clientY
  const dy = y - touchStartYRef.current

  // Pre-activation: a meaningful pre-timer move means the user was scrolling.
  // Disarm so the deferred `_activate` becomes a no-op.
  if (!draggingRef.current) {
    if (Math.abs(dy) > 6) armedRef.current = false
    return
  }

  const startIdx = indexRef.current
  const itemH = ctx.itemHeightMT.current
  const count = ctx.itemHandlesMT.current.length

  liftedDyRef.current = dy
  _setTransform(elementRef.current, dy)

  let target = startIdx + Math.round(dy / itemH)
  if (target < 0) target = 0
  if (target > count - 1) target = count - 1
  lastTargetRef.current = target

  _shiftOthers(startIdx, target)
}

function _onTouchEnd() {
  'main thread'
  if (!armedRef.current && !draggingRef.current) return
  armedRef.current = false

  if (!draggingRef.current) {
    // Long-press never confirmed — nothing to do.
    return
  }

  draggingRef.current = false
  const startIdx = indexRef.current
  let target = lastTargetRef.current
  if (target < 0) target = startIdx

  _clearAll()
  liftedDyRef.current = 0
  ctx.draggingIndexMT.current = -1
  runOnBackground(_emitDragEnd as any)(startIdx, target)
}

// ── BG callbacks ───────────────────────────────────────────────────────────

function _scheduleActivation(forIndex: number, delay: number) {
  if (pendingActivationTimer != null) {
    clearTimeout(pendingActivationTimer)
    pendingActivationTimer = null
  }
  pendingActivationTimer = setTimeout(() => {
    pendingActivationTimer = null
    if (props.index !== forIndex) return
    runOnMainThread(_activate as any)()
  }, delay)
}

function _emitDragStart(idx: number) {
  ctx.notifyDragStart(idx)
}

function _emitDragEnd(from: number, to: number) {
  if (pendingActivationTimer != null) {
    clearTimeout(pendingActivationTimer)
    pendingActivationTimer = null
  }
  ctx.commitReorder(from, to)
  ctx.notifyDragEnd()
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
